import { execSync } from 'child_process';

function avprobe (file) {
  let meta = execSync(`avprobe -show_format -of json "${file}"`, {
    stdio: [0]
  });

  return JSON.parse(meta);
}

export default avprobe;
