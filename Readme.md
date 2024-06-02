# Euler Diagrams Drawn with Ellipses Area-Proportionally (Edeap)

<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="packages/edeap/example-dark.svg">
    <img alt="" src="packages/edeap/example.svg" width="890" height="486">
  </picture>
</p>

Fork of https://github.com/mjwybrow/edeap

## Monorepo

- [edeap](packages/edeap/) core package ![NPM Version](https://img.shields.io/npm/v/edeap)
- [demo](packages/demo/) demo website

## Similar projects

- [upsetjs/venn.js](https://github.com/upsetjs/venn.js)
- [venn-isomorphic](https://github.com/stereobooster/venn-isomorphic)

## TODO

- [ ] add test for `generateDefaultLayout`
- [ ] new demo (host online)
  - add `@upsetjs/venn.js` for comparison
  - add [pan/zoom to SVG](https://github.com/stereobooster/beoe/tree/main/packages/pan-zoom)
- [ ] memoization?
- [ ] expose other configurations, like weights for Optmizer etc.
