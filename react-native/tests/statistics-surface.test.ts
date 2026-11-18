import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';
import ts from 'typescript';

type Element = { type: unknown; props: Record<string, unknown>; children: unknown[] };
type Props = Record<string, unknown>;
const families = ['arabesque', 'zellij', 'lattice'] as const;

function flatten(style: unknown): Props {
  if (Array.isArray(style)) return Object.assign({}, ...style.map(flatten));
  return style && typeof style === 'object' ? (style as Props) : {};
}

function textContent(node: unknown): string {
  if (typeof node === 'string') return node;
  if (!node || typeof node !== 'object' || !('children' in node)) return '';
  return (node as Element).children.map(textContent).join('');
}

function fixture() {
  let instanceId = ':r0:';
  let cardPatterns = true;
  const palette = { background: '#111F1A', surface: '#183B30' };
  const react = {
    memo: (component: unknown) => component,
    useId: () => instanceId,
    createElement: (type: unknown, props: Props | null, ...children: unknown[]): Element => ({
      type,
      props: props ?? {},
      children,
    }),
  };
  const modules: Record<string, unknown> = {
    react: { __esModule: true, default: react, memo: react.memo, useId: react.useId },
    'react-native': {
      View: 'View',
      Text: 'Text',
      Image: 'Image',
      StyleSheet: { create: (styles: unknown) => styles, flatten },
    },
    '../../../assets/ornaments/rubbed-arabesque.png': 'bundled-arabesque',
    '../../../assets/ornaments/rubbed-zellij.png': 'bundled-zellij',
    '../../../assets/ornaments/rubbed-lattice.png': 'bundled-lattice',
    '../../../shared/components/RevealBlock': { RevealBlock: 'RevealBlock' },
    '../../../shared/theme': {
      usePalette: () => palette,
      useCardPatterns: () => cardPatterns,
      fonts: { arabicUiBold: 'ArabicBold' },
    },
    '../theme': { usePalette: () => palette, useCardPatterns: () => cardPatterns },
    './styles': { s: { card: { padding: 18, borderRadius: 16 } } },
  };
  function load(path: string) {
    const exports: Record<string, unknown> = {};
    const code = ts.transpileModule(readFileSync(path, 'utf8'), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.React },
    }).outputText;
    vm.runInNewContext(code, {
      exports,
      require: (name: string) => {
        assert.ok(name in modules, name);
        return modules[name];
      },
    });
    return exports;
  }
  const ornament = load('src/shared/components/CardOrnament.tsx');
  modules['../../../shared/components/CardOrnament'] = ornament;
  modules['./CardOrnament'] = ornament;
  const surface = load('src/features/practice/components/StatisticsSurface.tsx');
  const card = load('src/shared/components/Card.tsx');
  const watermark = load('src/features/practice/components/ArabicWatermark.tsx');
  function render(component: unknown, id: string, props: Props) {
    instanceId = id;
    return (component as (props: Props) => Element)({ children: 'content', ...props });
  }
  function decoration(node: unknown): Element | undefined {
    if (!node || typeof node !== 'object' || !('children' in node)) return;
    const element = node as Element;
    if (element.type === ornament.CardOrnament) return element;
    for (const child of element.children) {
      const found = decoration(child);
      if (found) return found;
    }
  }
  function pattern(root: Element) {
    const child = decoration(root);
    assert.ok(child, 'decorated surface has an ornament');
    const layer = (child.type as (props: Props) => Element)(child.props);
    const image = layer.children[0] as Element;
    assert.equal(image.type, 'Image');
    return { layer, image };
  }
  return {
    palette,
    setCardPatterns: (enabled: boolean) => {
      cardPatterns = enabled;
    },
    ornament: (props: Props) => (ornament.CardOrnament as (props: Props) => Element | null)(props),
    watermark: () =>
      (watermark.ArabicWatermark as (props: Props) => Element | null)({ label: 'الإحصاءات' }),
    decoration,
    pattern,
    card: (id: string, props: Props = {}) => render(card.Card, id, props),
    surface: (id: string, props: Props = {}) => render(surface.StatisticsSurface, id, props),
  };
}

test('named ornament families select three distinct bundled stencils on Cards and statistics surfaces', () => {
  const app = fixture();
  for (const render of [app.card, app.surface]) {
    const sources = families.map(
      (ornament) => app.pattern(render(':same-card:', { ornament })).image.props.source,
    );
    assert.deepEqual(sources, ['bundled-arabesque', 'bundled-zellij', 'bundled-lattice']);
  }
});

test('the global preference hides every decorative family without changing opaque card content', () => {
  const app = fixture();
  for (const color of ['#F3EFE4', '#111F1A']) {
    app.palette.background = color;
    app.palette.surface = color;
    for (const variant of families) {
      app.setCardPatterns(false);
      assert.equal(app.watermark(), null, 'decorative lettering also disappears on plain cards');
      // Custom Pressable cards use the same layer directly.
      assert.equal(app.ornament({ surface: color, variant }), null);
      for (const render of [app.card, app.surface]) {
        const root = render(':preference-card:', { ornament: variant });
        const decoration = app.decoration(root);
        assert.ok(decoration);
        assert.equal(app.ornament(decoration.props), null);
        assert.equal(flatten(root.props.style).backgroundColor, color);
        assert.equal(textContent(root), 'content');
        app.setCardPatterns(true);
        assert.equal(textContent(app.watermark()), 'الإحصاءات');
        assert.ok(app.pattern(render(':preference-card:', { ornament: variant })).image);
        assert.equal(app.decoration(render(':plain-card:', { ornament: false })), undefined);
        app.setCardPatterns(false);
      }
    }
  }
});

test('automatic family choice is stable across rerenders, sibling order, theme changes and an ornament toggle', () => {
  const app = fixture();
  const ids = Array.from({ length: 18 }, (_, index) => `:r${index.toString(32)}:`);
  for (const render of [app.card, app.surface]) {
    const choices = new Map(ids.map((id) => [id, app.pattern(render(id)).image.props.source]));
    assert.equal(new Set(choices.values()).size, 3, 'separate instances get real family variation');
    app.palette.background = '#F3EFE4';
    app.palette.surface = '#FFFFFF';
    for (const id of [...ids].reverse()) {
      assert.equal(app.decoration(render(id, { ornament: false })), undefined);
      const next = render(id, { ornament: true, reveal: false, style: { padding: 24 } });
      assert.equal(
        app.pattern(next).image.props.source,
        choices.get(id),
        'the same mounted identity retains its stencil',
      );
    }
  }
});

test('all families preserve opaque surfaces, caller geometry, touch handling and screen-reader content', () => {
  const app = fixture();
  for (const color of ['#F3EFE4', '#111F1A']) {
    app.palette.background = color;
    for (const ornament of families) {
      const surface = app.surface(':surface:', { ornament });
      assert.equal(surface.type, 'RevealBlock');
      assert.equal(surface.props.keepOpaque, true);
      assert.equal(flatten(surface.props.style).backgroundColor, color);
      const card = app.card(':card:', {
        ornament,
        color: '#000000',
        style: { backgroundColor: color, padding: 23, borderRadius: 9 },
      });
      const cardStyle = flatten(card.props.style);
      assert.equal(cardStyle.backgroundColor, color);
      assert.equal(cardStyle.padding, 23);
      assert.equal(cardStyle.borderRadius, 9);
      assert.equal(cardStyle.opacity, undefined, 'the card underlay is not faded');
      assert.equal(card.children.at(-1), 'content');
      for (const root of [surface, card]) {
        const { layer, image } = app.pattern(root);
        assert.equal(layer.props.pointerEvents, 'none');
        assert.equal(layer.props.accessible, false);
        assert.equal(layer.props.importantForAccessibility, 'no-hide-descendants');
        assert.equal(image.props.accessible, false);
        const tone = flatten(image.props.style);
        assert.ok(typeof tone.opacity === 'number' && tone.opacity > 0 && tone.opacity <= 0.3);
      }
      assert.equal(flatten(app.pattern(card).layer.props.style).borderRadius, 9);
    }
  }
  assert.equal(app.surface(':surface:', { reveal: false }).type, 'View');
});
