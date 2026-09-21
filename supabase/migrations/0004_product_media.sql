insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'product-images',
  'product-images',
  true,
  5242880,
  array['image/jpeg','image/png','image/webp','image/avif']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "public can view product image objects"
on storage.objects for select
using (bucket_id = 'product-images');

create policy "admins can upload product image objects"
on storage.objects for insert
to authenticated
with check (bucket_id = 'product-images' and public.is_admin());

create policy "admins can update product image objects"
on storage.objects for update
to authenticated
using (bucket_id = 'product-images' and public.is_admin())
with check (bucket_id = 'product-images' and public.is_admin());

create policy "admins can delete product image objects"
on storage.objects for delete
to authenticated
using (bucket_id = 'product-images' and public.is_admin());

create unique index if not exists one_primary_image_per_product
on public.product_images(product_id)
where is_primary = true;

create index if not exists product_images_product_id_idx
on public.product_images(product_id, sort_order);
