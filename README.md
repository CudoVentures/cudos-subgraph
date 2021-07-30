# cudos-subgraph

## Building the subgraph

To build the subgraph, run the following command:

```sh
yarn codegen && yarn build
```

## Deploying the subgraph

To deploy the subgraph:

1. Install [Metamask](https://metamask.io/) and import the **CUDOS wallet management account** from 1Password
2. Connect [Subgraph Studio](https://thegraph.com/studio/) to the **CUDOS wallet management account**, and retrieve the deploy key
3. Authenticate the Graph CLI with Subgraph Studio:

   ```sh
   yarn run graph auth --studio DEPLOY_KEY
   ```

4. Deploy the subgraph:

   ```sh
   yarn deploy
   ```
