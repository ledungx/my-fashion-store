export default function cdnLoader({ src, width, quality }) {
    // We are now bypassing our custom cdn.myfashionstore.com completely.
    // By directly returning src, Next.js will push the native ever-pretty.com or Shopify CDN URLs natively to the DOM without proxy manipulation!
    return src;
}
