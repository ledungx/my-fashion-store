import { NextResponse } from 'next/server';
import Typesense from 'typesense';

let client = new Typesense.Client({
  nodes: [{ host: 'localhost', port: '8108', protocol: 'http' }],
  apiKey: process.env.TYPESENSE_API_KEY || 'development_api_key_123',
  connectionTimeoutSeconds: 5,
});

export async function GET(request) {
  const { searchParams } = new URL(request.url);

  // Wildcard '*' is required by Typesense when the search query is entirely empty!
  const q = searchParams.get('q') || '*';
  const category = searchParams.get('category'); // Extract category ID if strictly specified via Category maps
  const color = searchParams.get('color');
  const size = searchParams.get('size');
  const material = searchParams.get('material');
  const priceMin = searchParams.get('priceMin');
  const priceMax = searchParams.get('priceMax');
  const sort_by = searchParams.get('sort_by'); 
  const page = parseInt(searchParams.get('page') || '1', 10);

  // Construct secure faceted filters
  let filter_by = [];
  if (category) filter_by.push(`categoryId:=${category}`);
  if (color) filter_by.push(`color:=${color}`);
  if (size) filter_by.push(`size:=${size}`);
  if (material) filter_by.push(`material:=${material}`);
  
  if (priceMin && priceMax) filter_by.push(`price:>=${priceMin} && price:<=${priceMax}`);
  else if (priceMin) filter_by.push(`price:>=${priceMin}`);
  else if (priceMax) filter_by.push(`price:<=${priceMax}`);

  const per_page = parseInt(searchParams.get('per_page') || '24', 10);

  let searchParameters = {
    q,
    query_by: 'name,description',
    filter_by: filter_by.join(' && '),
    facet_by: 'color,size,material,price,brandId,categoryId', // Generate counts dynamically
    page,
    per_page
  };

  if (sort_by) {
    searchParameters.sort_by = sort_by;
  }

  try {
    const searchResults = await client.collections('products').documents().search(searchParameters);
    return NextResponse.json(searchResults);
  } catch (error) {
    console.error("Typesense backend search routing failed:", error);
    return NextResponse.json({ error: 'Search failed' }, { status: 500 });
  }
}
