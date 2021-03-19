import {getUnnamedAccounts, deployments} from 'hardhat';

const {execute} = deployments;

async function main() {
  const others = await getUnnamedAccounts();
  let n = 1;
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      await execute('BitmapToken', {from: others[i]}, 'mint', n)
      n++;
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
