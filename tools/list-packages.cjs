// Lists all packages uniquely in a JSON input stream.
// Usage: pnpm list --depth 0 --json -r | node ./tools/list-packages.cjs
// Usage: pnpm list --depth 9999 --json -r | node ./tools/list-packages.cjs

process.stdin.setEncoding("utf8");

let input = "";

// Read the input stream
process.stdin.on("data", (chunk) => {
  input += chunk;
});

// When the input stream ends, process the data
process.stdin.on("end", () => {
  try {
    const data = JSON.parse(input);
    const packages = {};
    data.forEach((entry) => extractPackages(entry, packages));
    const sortedPackageNames = Object.keys(packages).sort();

    sortedPackageNames.forEach((packageName) => {
      const versions = packages[packageName];
      versions.forEach((version) => {
        if (versions.length > 1 && !version.startsWith("link")) {
          console.log(`${packageName}@${version} <-- DUPLICATE`);
        } else {
          console.log(`${packageName}@${version}`);
        }
      });
    });
  } catch (error) {
    console.error("Error parsing JSON:", error);
  }
});

// A function to recursively extract package names and versions
function extractPackages(node, result) {
  if (node.devDependencies) {
    for (const key in node.devDependencies) {
      const dep = node.devDependencies[key];
      if (dep.version) {
        if (!result[dep.from]) {
          result[dep.from] = [];
        }
        if (!result[dep.from].includes(dep.version)) {
          result[dep.from].push(dep.version);
        }
      }
      extractPackages(dep, result);
    }
  }
  if (node.dependencies) {
    for (const key in node.dependencies) {
      const dep = node.dependencies[key];
      if (dep.version) {
        if (!result[dep.from]) {
          result[dep.from] = [];
        }
        if (!result[dep.from].includes(dep.version)) {
          result[dep.from].push(dep.version);
        }
      }
      extractPackages(dep, result);
    }
  }
  return result;
}
