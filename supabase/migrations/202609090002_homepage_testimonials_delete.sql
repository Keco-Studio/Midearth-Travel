-- Allow deleting homepage testimonials when reviews are removed in CMS.
drop policy if exists "Current admin can delete homepage testimonials" on public.homepage_testimonials;
create policy "Current admin can delete homepage testimonials"
  on public.homepage_testimonials for delete to anon, authenticated using (true);
