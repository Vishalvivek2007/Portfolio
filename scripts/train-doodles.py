# Trains the Lab's doodle reader on the pictures scripts/fetch-doodles.mjs rendered, then writes what the page loads:
# public/lab/doodles.bin (int8 weights) and public/lab/doodles.json (labels, scales, measured accuracy, demo doodles).
# Run: python scripts/train-doodles.py [dir] [epochs] [training doodles per category, default all of them]
import base64, json, sys, time
import numpy as np, torch, torch.nn as nn, torch.nn.functional as F

D = sys.argv[1] if len(sys.argv) > 1 else "assets-src/doodles"
EPOCHS = int(sys.argv[2]) if len(sys.argv) > 2 else 7
meta = json.load(open(D + "/meta.json"))
labels, NTR, NTE = meta["labels"], meta["train"], meta["test"]
PER = int(sys.argv[3]) if len(sys.argv) > 3 else NTR
C, WIDTH, HID, BATCH = len(labels), (24, 48, 96), 384, 256
torch.manual_seed(1); np.random.seed(1); torch.set_num_threads(12)
train = np.memmap(D + "/train.bin", np.uint8, "r").reshape(-1, 784)  # category-major: row // NTR is the label
test = np.memmap(D + "/test.bin", np.uint8, "r").reshape(-1, 784)
rows = (np.arange(C)[:, None] * NTR + np.arange(PER)[None, :]).ravel()


class Net(nn.Module):
    def __init__(s):
        super().__init__()
        ch = (1,) + WIDTH
        s.convs = nn.ModuleList(nn.Conv2d(ch[i], ch[i + 1], 3, padding=1, bias=False) for i in range(3))
        s.bns = nn.ModuleList(nn.BatchNorm2d(c) for c in WIDTH)
        s.fc1, s.fc2, s.drop = nn.Linear(WIDTH[-1] * 9, HID), nn.Linear(HID, C), nn.Dropout(0.2)

    def forward(s, x):
        for conv, bn in zip(s.convs, s.bns): x = F.max_pool2d(F.relu(bn(conv(x))), 2)
        return s.fc2(s.drop(F.relu(s.fc1(x.flatten(1)))))


def pictures(a): return torch.from_numpy(np.array(a)).float().div_(255).view(-1, 1, 28, 28)


net, steps = Net(), EPOCHS * (len(rows) // BATCH)
opt = torch.optim.AdamW(net.parameters(), lr=4e-3, weight_decay=1e-2)
sched = torch.optim.lr_scheduler.OneCycleLR(opt, max_lr=4e-3, total_steps=steps, pct_start=0.15)
t0 = time.time()
for epoch in range(EPOCHS):
    net.train(); order = np.random.permutation(rows); seen = loss_sum = 0
    for b in range(len(rows) // BATCH):
        j = np.sort(order[b * BATCH:(b + 1) * BATCH])
        x, y = pictures(train[j]), torch.from_numpy(j // NTR).long()
        flip = torch.rand(len(j)) < 0.5  # a doodle is the same thing mirrored
        x[flip] = x[flip].flip(3)
        loss = F.cross_entropy(net(x), y, label_smoothing=0.1)
        opt.zero_grad(); loss.backward(); opt.step(); sched.step()
        seen += 1; loss_sum += loss.item()
    print(f"epoch {epoch + 1}/{EPOCHS}  loss {loss_sum / seen:.3f}  {time.time() - t0:.0f} s", flush=True)

# What ships: batch norm folded into the convolutions, then every weight rounded to int8 with one scale per output.
net.eval(); shipped = []
with torch.no_grad():
    folded = []
    for conv, bn in zip(net.convs, net.bns):
        k = bn.weight / torch.sqrt(bn.running_var + bn.eps)
        folded.append((True, conv.weight * k[:, None, None, None], bn.bias - bn.running_mean * k))
    folded += [(False, fc.weight, fc.bias) for fc in (net.fc1, net.fc2)]
    for is_conv, w, b in folded:
        w = w.numpy().astype(np.float32); flat = w.reshape(len(w), -1)
        scale = np.array([float("%.9g" % v) for v in np.abs(flat).max(1) / 127 + 1e-12], np.float32)
        shipped.append(dict(conv=is_conv, cin=w.shape[1], cout=len(w), scale=scale, bias=np.array([float("%.9g" % v) for v in b.numpy()], np.float32),
                            q=np.clip(np.rint(flat / scale[:, None]), -127, 127).astype(np.int8)))


def run(x):  # the shipped arithmetic, as src/components/lab/doodle.ts does it
    with torch.no_grad():
        for l in shipped:
            w, b = torch.from_numpy(l["q"].astype(np.float32) * l["scale"][:, None]), torch.from_numpy(l["bias"])
            if l["conv"]: x = F.max_pool2d(F.relu(F.conv2d(x, w.view(l["cout"], l["cin"], 3, 3), b, padding=1)), 2)
            else: x = F.linear(x.flatten(1), w, b) if l is shipped[-1] else F.relu(F.linear(x.flatten(1), w, b))
    return F.softmax(x, 1)


top = torch.cat([run(pictures(test[i:i + 2000])).topk(3).indices for i in range(0, len(test), 2000)])
truth = torch.arange(len(test)) // NTE
top1, top3 = (top[:, 0] == truth).float().mean().item(), (top == truth[:, None]).any(1).float().mean().item()
print(f"shipped net on {len(test):,} unseen doodles: first guess right {top1:.1%}, in its top three {top3:.1%}")
per = (top[:, 0] == truth).float().view(C, NTE).mean(1)
print("weakest:", ", ".join(f"{labels[i]} {per[i]:.0%}" for i in per.argsort()[:12].tolist()))

# A few test doodles the net reads confidently, with their strokes, for the page's demo loop.
demo = []
for name in ["cat", "bicycle", "The Eiffel Tower", "snowman", "octopus", "guitar", "sailboat", "cactus", "butterfly", "lighthouse", "helicopter", "mushroom", "crown", "giraffe", "rainbow", "pizza"]:
    c = labels.index(name)
    for d in meta["pool"][c]:
        p = run(pictures(test[d["at"]:d["at"] + 1]))[0]
        if p.argmax().item() == c and p[c] > 0.6 and len(d["strokes"]) >= 2:
            demo.append(dict(label=c, strokes=d["strokes"])); break

open("public/lab/doodles.bin", "wb").write(b"".join(l["q"].tobytes() for l in shipped))
json.dump(dict(labels=labels, train=len(rows), test=len(test), top1=round(top1, 4), top3=round(top3, 4), demo=demo,
               layers=[dict(conv=l["conv"], cin=l["cin"], cout=l["cout"], scale=[float("%.9g" % v) for v in l["scale"]], bias=[float("%.9g" % v) for v in l["bias"]]) for l in shipped]),
          open("public/lab/doodles.json", "w"), separators=(",", ":"))

# A handful of test doodles with the shipped net's answers, so the TypeScript port can be checked against this one.
pick = np.arange(24) * (len(test) // 24) + 7
p = run(pictures(test[pick])).topk(3)
json.dump(dict(x=base64.b64encode(np.ascontiguousarray(test[pick]).tobytes()).decode(), top=p.indices.tolist(), p=[[round(v, 6) for v in r] for r in p.values.tolist()]),
          open("src/components/lab/doodle.fixture.json", "w"), separators=(",", ":"))
print(f"wrote public/lab/doodles.bin ({sum(l['q'].size for l in shipped):,} bytes), doodles.json with {len(demo)} demo doodles, and the test fixture")
