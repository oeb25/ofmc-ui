import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import childProcess from "child_process";
import { promises as fs } from "fs";
import path from "path";

const app = express();

app.use(cors());

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.get("/name", (req, res) => {
  res.send("ofmc-ui");
});

const ofmcFile = (
  path: string
): {
  close: () => void;
  promise: Promise<{
    stdout: string;
    stderr: string;
  }>;
} => {
  const bin = __dirname + "/../bin/ofmc-mac";
  const p = childProcess.spawn(bin, ["--numSess", "2", path]);

  let stdout = "";
  let stderr = "";
  p.stdout.setEncoding("utf-8");
  p.stdout.on("data", (data) => (stdout += data));
  p.stderr.setEncoding("utf-8");
  p.stderr.on("data", (data) => (stderr += data));

  return {
    close: () => p.kill("SIGABRT"),
    promise: new Promise((res) => {
      p.on("close", (code) => {
        res({ stdout, stderr });
      });
    }),
  };
};

const temp = path.resolve("temp");
fs.mkdir(temp, { recursive: true });
const tempDir = fs.mkdtemp(path.join(temp, "/ofmc-ui"));

const ofmc = async (src: string) => {
  const dir = await tempDir;
  const name = Math.random().toString().substring(2) + ".AnB";
  const p = path.join(dir, name);
  await fs.writeFile(p, src, "utf-8");
  const res = ofmcFile(p);
  res.promise.finally(() => {
    fs.unlink(p);
  });
  return res;
};

app.post("/analyze", async (req, res) => {
  let body = req.body as unknown;
  if (typeof body == "object" && body !== null && "source" in body) {
    const body2 = body as { source: unknown };
    if (typeof body2.source == "string") {
      const p = await ofmc(body2.source);
      let done = false;
      res.on("close", () => {
        if (!done) {
          p.close();
        }
      });
      p.promise.then((r) => {
        done = true;
        res.send(r);
      });
      return;
    }
  }

  res.end();
});

app.use(express.static("dist/"));

app.listen(8080, () => {
  console.log("live at http://0.0.0.0:8080");
});
