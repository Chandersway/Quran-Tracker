import React, { useRef } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon, IconButton, T } from '../../../shared/components';
import { usePalette } from '../../../shared/theme';
import type { notesLibraryCopy } from '../libraryCopy';
import type { DropBounds, FolderDropRect } from '../../../domain/notesLibrary';

export function NoteFoldersBar({
  folders,
  selected,
  onSelect,
  onCreate,
  dragging,
  hovered,
  onMeasured,
  onViewportMeasured,
  copy,
}: {
  folders: string[];
  selected: string | null;
  onSelect: (name: string | null) => void;
  onCreate: () => void;
  dragging: boolean;
  hovered: string | null;
  onMeasured: (rect: FolderDropRect) => void;
  onViewportMeasured: (bounds: DropBounds) => void;
  copy: (typeof notesLibraryCopy)['nl'];
}) {
  const p = usePalette();
  const insets = useSafeAreaInsets();
  const refs = useRef(new Map<string, React.ComponentRef<typeof View>>());
  const scroll = useRef<React.ComponentRef<typeof ScrollView>>(null);
  const measureTarget = (view: React.ComponentRef<typeof View>, folder: string) =>
    view.measureInWindow((x, y, width, height) => {
      if (refs.current.get(folder) === view) onMeasured({ folder, x, y, width, height });
    });
  const measure = () => refs.current.forEach(measureTarget);
  const measureViewport = () => {
    scroll.current?.getNativeScrollRef()?.measureInWindow((x, y, width, height) => {
      onViewportMeasured({ x, y, width, height });
      measure();
    });
  };
  return (
    <View
      onLayout={measureViewport}
      style={{
        paddingLeft: Math.max(12, insets.left),
        paddingRight: Math.max(12, insets.right),
        paddingBottom: Math.max(8, insets.bottom),
        paddingTop: 4,
        backgroundColor: p.surface,
        borderTopWidth: 1,
        borderTopColor: p.line,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <T translate={false} size={12} bold style={{ flex: 1 }}>
          {dragging ? copy.drop : copy.folders}
        </T>
        <IconButton name="folder-plus" label={copy.create} onPress={onCreate} />
      </View>
      <ScrollView
        ref={scroll}
        horizontal
        onLayout={measureViewport}
        showsHorizontalScrollIndicator
        onScroll={measure}
        scrollEventThrottle={50}
      >
        <Pressable
          onPress={() => onSelect(null)}
          style={{ minHeight: 48, paddingHorizontal: 12, justifyContent: 'center' }}
        >
          <T translate={false} bold={selected === null}>
            {copy.all}
          </T>
        </Pressable>
        {['', ...folders].map((folder) => (
          <View
            key={folder}
            ref={(node) => {
              if (node) refs.current.set(folder, node);
              else refs.current.delete(folder);
            }}
            onLayout={() => {
              const view = refs.current.get(folder);
              if (view) measureTarget(view, folder);
            }}
            collapsable={false}
          >
            <Pressable
              onPress={() => onSelect(folder)}
              accessibilityRole="button"
              accessibilityState={{ selected: selected === folder }}
              style={{
                minHeight: 48,
                paddingHorizontal: 12,
                gap: 7,
                flexDirection: 'row',
                alignItems: 'center',
                borderRadius: 12,
                backgroundColor:
                  dragging && hovered === folder
                    ? p.primary
                    : selected === folder
                      ? p.subtle
                      : p.surface,
              }}
            >
              <Icon
                name="folder"
                size={18}
                color={dragging && hovered === folder ? p.onPrimary : p.ink}
              />
              <T translate={false} color={dragging && hovered === folder ? p.onPrimary : p.ink}>
                {folder || copy.unfiled}
              </T>
            </Pressable>
          </View>
        ))}
      </ScrollView>
      <T translate={false} muted size={11}>
        {copy.drag}
      </T>
    </View>
  );
}
