import os

def on_page_markdown(markdown, page, config, files):
    meta = page.meta
    if 'shader' not in meta:
        return markdown
        
    shader = meta['shader']
    visualizer = meta.get('visualizer', '/assets/js/noop_visualizer.js')
    
    # replace /ts/ with assets/js/ and .ts with .js
    visualizer = visualizer.replace('/ts/', 'assets/js/').replace('.ts', '.js')
    if visualizer.startswith('/'):
        visualizer = visualizer[1:]
        
    import json
    options_meta = meta.get('visualizerOptions', None)
    if options_meta is None:
        options_js = 'null'
    elif isinstance(options_meta, str):
        options_js = json.dumps(options_meta)
    else:
        options_js = json.dumps(json.dumps(options_meta))
        
    from urllib.parse import urlparse
    site_url = config.get('site_url', '')
    if site_url:
        base_path = urlparse(site_url).path
        if not base_path.startswith('/'):
            base_path = '/' + base_path
        if not base_path.endswith('/'):
            base_path = base_path + '/'
    else:
        base_path = '/'
        
    visualizer = base_path + visualizer
    
    shader_path = os.path.join(os.path.dirname(page.file.abs_src_path), shader)
    try:
        with open(shader_path, 'r') as f:
            shader_content = f.read()
    except Exception as e:
        shader_content = f"Error reading {shader}: {e}"
        
    import html
    escaped_shader_content = html.escape(shader_content)
        
    html_content = f"""
<div id='tour-wrapper'>
  <wgsl-tour id='tour'>
    <pre id='tour-content' style='visibility: hidden'>{escaped_shader_content}</pre>
  </wgsl-tour>
</div>
<script type="module">
  import VisualizationBuilder from '{visualizer}';
  customElements.whenDefined('wgsl-tour').then(() => {{
    let tour = document.getElementById('tour');
    tour.setVisualizationBuilder(new VisualizationBuilder({options_js}));
  }});
</script>
"""
    return markdown + "\n\n" + html_content
