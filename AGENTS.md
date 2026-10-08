<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Keep the client catalogue snapshot in a dedicated browser-safe module with CDN asset pointers; this prevents fictitious seed prices or placeholder images from replacing store products.
- Version persisted demo data and migrate product references when replacing the catalogue; this keeps existing orders and sessions usable.
- Embed the original logo as a browser-safe data URL so external deployments do not depend on Lovable-only asset routing.
