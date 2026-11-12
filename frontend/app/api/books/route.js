import { NextResponse } from "next/server";
import { getSupabaseConfig } from "../../lib/supabaseServer";

function reply(data, status = 200) {
  return NextResponse.json(data, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

export async function GET() {
  const config = getSupabaseConfig();
  if (!config) return reply({ error: "Supabase is not configured." }, 503);

  try {
    const query = new URLSearchParams({
      select: "id,title,author,price_cents,category,description,cover_note,cover_style,cover_url,sections,publisher,publication_year,pages,shelf,stock,age,dimensions,weight,binding,delivery,is_preorder,release_date,display_order",
      is_active: "eq.true",
      order: "display_order.asc,id.asc",
    });
    const response = await fetch(config.url + "/rest/v1/bookstore_books?" + query.toString(), {
      method: "GET",
      cache: "no-store",
      headers: {
        apikey: config.key,
        Authorization: "Bearer " + config.key,
        Accept: "application/json",
      },
    });
    if (!response.ok) {
      return reply({ error: "Catalog is not ready. Run the BookStore admin migration in Supabase." }, 503);
    }
    const rows = await response.json().catch(() => null);
    if (!Array.isArray(rows)) return reply({ error: "Invalid catalog response." }, 503);

    return reply(rows.map((book) => ({
      id: book.id,
      title: book.title,
      author: book.author,
      price: book.price_cents,
      category: book.category,
      description: book.description,
      coverNote: book.cover_note,
      coverStyle: book.cover_style,
      coverUrl: book.cover_url,
      sections: book.sections || [],
      publisher: book.publisher,
      year: book.publication_year,
      pages: book.pages,
      shelf: book.shelf,
      stock: book.stock,
      age: book.age,
      dimensions: book.dimensions,
      weight: book.weight,
      binding: book.binding,
      delivery: book.delivery,
      comingSoon: Boolean(book.is_preorder),
      releaseDate: book.release_date,
      displayOrder: book.display_order,
    })));
  } catch {
    return reply({ error: "Catalog service is temporarily unavailable." }, 503);
  }
}
