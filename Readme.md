# Euler Diagrams Drawn with Ellipses Area-Proportionally (Edeap)

Fork of https://github.com/mjwybrow/edeap

## TODO

- [ ] use same format as `venn.js`
- [ ] old demo (host online)
- [ ] publish npm package
  - update readme (uasgae example)
  - link to the demo
  - check name of package, rename repo
  - check keywords
- [ ] add test for `generateDefaultLayout`
- [ ] new demo (host online)
  - add `@upsetjs/venn.js` for comparison
  - add pan/zoom to SVG
- [ ] memoization?
- [ ] expose other configurations, like weights for Optmizer etc.

```ts
// https://github.com/upsetjs/venn.js/blob/main/src/index.d.ts
export interface ISetOverlap {
  sets: string[];
  size: number;
}
```
