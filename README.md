# w3link

> The IPFS gateway for web3.storage is not "another gateway", but a set of caching layers that sits on top of existing IPFS public gateways.

# Table of Contents <!-- omit in toc -->

- [Usage](#usage)
- [Packages](#packages)
- [Building](#building)
- [Contributing](#contributing)
- [License](#license)

## Usage

Get your files from the IPFS Network via their unique content identifier with a lightning fast experience. Like any other IPFS gateway, `w3s.link` supports IPFS path style resolutions `https://w3s.link/ipfs/{cid}` and subdomain style resolution `https://{CID}.ipfs.w3s.link/{optional path to resource}`

```
> curl https://w3s.link/ipfs/bafkreig5ry6hjrkj2xyut5yrdjztap2z2yso6qlq4n7rnalt5l4lsccw2u
Hello web3.storage! 😎

> curl https://bafkreig5ry6hjrkj2xyut5yrdjztap2z2yso6qlq4n7rnalt5l4lsccw2u.ipfs.w3s.link
Hello web3.storage! 😎
```

## Packages

### Edge gateway link

The core of w3s.link, the Edge Gateway is serverless code running across the globe to provide fast IPFS content retrieval.

Check out the [Edge Gateway documentation](./packages/edge-gateway-link).

## Building

Want to help us improve w3link? Great! This project uses node v16 and pnpm. It's a monorepo that use workspaces to handle resolving dependencies between the local `packages/*` folders.

Copy the <.env.tpl> file to `.env` and install the deps with `pnpm`.

```console
# install deps
pnpm install
```

# Contributing

Feel free to join in. All welcome. [Open an issue](https://github.com/web3-storage/w3link/issues)!

If you're opening a pull request, please see the [guidelines in DEVELOPMENT.md](./DEVELOPMENT.md#how-should-i-write-my-commits) on structuring your commit messages so that your PR will be compatible with our [release process](./DEVELOPMENT.md#release).

# License

Dual-licensed under [MIT + Apache 2.0](https://github.com/web3-storage/w3link/blob/main/LICENSE.md)