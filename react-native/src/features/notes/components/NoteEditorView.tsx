import React from 'react';
import {
  Pressable,
  View,
  KeyboardAvoidingView,
  Keyboard,
  Platform,
  ScrollView,
  TextInput,
} from 'react-native';
import {
  Button,
  Field,
  Icon,
  IconButton,
  Notice,
  Screen,
  Sheet,
  Segments,
  T,
  s,
} from '../../../shared/components';
import { fonts, usePalette } from '../../../shared/theme';
import { useI18n } from '../../../i18n';
import type { NoteLabels } from '../../../i18n/notes';
import type { NoteEditor } from '../hooks/useNoteEditor';
import { targetTitle, toggleTag, updateEditorText } from '../editor/noteEditor';
import { sourceNoteColorKeys } from '../editor/noteFormat';
import { noteTagList } from '../../../exporting/notesExport';
import { FormattedNote, useNoteColors } from './FormattedNote';
import { NoteTargetControl } from './NoteTargetControl';
import { NoteTargetSummary } from './NoteTargetSummary';
import { RichNoteInput } from './RichNoteInput';

export function NoteEditorView({
  editor,
  copy,
  language,
}: {
  editor: NoteEditor;
  copy: NoteLabels;
  language: 'en' | 'nl' | 'ar';
}) {
  const p = usePalette();
  const noteColors = useNoteColors();
  const { t } = useI18n();
  const {
    fields,
    setFields,
    activeNote,
    preview,
    setPreview,
    showFormatting,
    setShowFormatting,
    showMetadata,
    setShowMetadata,
    message,
    error,
    busy,
    noteTarget,
    closeEditor,
    saveNote,
    deleteNote,
  } = editor;
  const onSavePress = () => {
    Keyboard.dismiss();
    return saveNote();
  };
  return (
    <Screen scroll={false} style={{ padding: 12, gap: 0 }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1, gap: 8 }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <IconButton
            name="arrow-left"
            mirrorInRtl
            label={copy.cancel}
            onPress={closeEditor}
            disabled={busy}
          />
          <View style={{ flex: 1 }}>
            <T translate={false} size={13} muted numberOfLines={1}>
              {fields.target ? targetTitle(fields.target, language, copy) : copy.scope}
            </T>
          </View>
          <IconButton
            name={preview ? 'edit-2' : 'eye'}
            label={preview ? copy.edit : copy.preview}
            onPress={() => setPreview((value) => !value)}
          />
          <IconButton
            name="sliders"
            label={t('inline.AyahNotesScreen.017eeb0ddc')}
            onPress={() => {
              Keyboard.dismiss();
              setShowMetadata(true);
            }}
          />
          <IconButton
            name="check"
            label={busy ? copy.saving : copy.save}
            onPress={onSavePress}
            disabled={busy}
          />
        </View>
        {message && message !== 'new' && <Notice message={message} />}
        {error && <Notice error message={error} />}
        {preview ? (
          <ScrollView contentContainerStyle={{ gap: 14, padding: 16 }}>
            <T translate={false} size={26} bold>
              {fields.title || (fields.target ? targetTitle(fields.target, language, copy) : '')}
            </T>
            <T translate={false} size={13} muted>
              {fields.target ? targetTitle(fields.target, language, copy) : ''}
              {fields.folder.trim() ? ` · ${fields.folder.trim()}` : ''}
            </T>
            {!!noteTagList(fields.tags).length && (
              <T translate={false} size={13} color={p.primary}>
                {noteTagList(fields.tags)
                  .map((tag) => `#${tag}`)
                  .join('  ')}
              </T>
            )}
            {fields.target && <NoteTargetSummary target={fields.target} />}
            {fields.note ? (
              <FormattedNote note={fields.note} style={fields} />
            ) : (
              <T muted>{copy.noteTitle}</T>
            )}
          </ScrollView>
        ) : (
          <View
            style={{ flex: 1, backgroundColor: p.surface, borderRadius: 12, overflow: 'hidden' }}
          >
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                borderBottomColor: p.line,
                borderBottomWidth: 1,
              }}
            >
              <TextInput
                accessibilityLabel={copy.noteTitle}
                value={fields.title}
                onChangeText={(title) => setFields((current) => ({ ...current, title }))}
                placeholder={copy.noteTitle}
                placeholderTextColor={p.muted}
                style={{
                  flex: 1,
                  minHeight: 48,
                  paddingHorizontal: 16,
                  color: p.ink,
                  fontFamily: language === 'ar' ? fonts.arabicUi : fonts.regular,
                  fontSize: 20,
                  fontWeight: '700',
                  textAlign: language === 'ar' ? 'right' : 'left',
                }}
              />
              <IconButton
                name="type"
                label={copy.formatting}
                onPress={() => {
                  Keyboard.dismiss();
                  setShowFormatting(true);
                }}
              />
            </View>
            <RichNoteInput
              accessibilityLabel={copy.body}
              text={fields.note}
              formatSpans={fields.formatSpans}
              onChangeText={(note) => setFields((current) => updateEditorText(current, note))}
              placeholder={copy.editHint}
              placeholderTextColor={p.muted}
              scrollEnabled
              multiline
              textAlignVertical="top"
              style={[
                s.input,
                {
                  flex: 1,
                  minHeight: 0,
                  borderWidth: 0,
                  borderRadius: 0,
                  padding: 16,
                  color: noteColors[fields.textColorKey] ?? p.ink,
                  backgroundColor: p.surface,
                  borderColor: p.line,
                  fontSize: fields.fontSize,
                  lineHeight: fields.fontSize * 1.6,
                  fontWeight: fields.isBold || fields.headingLevel > 0 ? '700' : '400',
                  fontStyle: fields.isItalic ? 'italic' : 'normal',
                  textDecorationLine:
                    fields.isUnderline && fields.isStrike
                      ? 'underline line-through'
                      : fields.isUnderline
                        ? 'underline'
                        : fields.isStrike
                          ? 'line-through'
                          : 'none',
                },
              ]}
            />
          </View>
        )}
      </KeyboardAvoidingView>
      <Sheet
        visible={showFormatting}
        title={copy.formatting}
        translateTitle={false}
        onClose={() => setShowFormatting(false)}
      >
        <View style={{ gap: 12 }}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <T size={13} bold>
              {copy.size}: {fields.fontSize}
            </T>
            <View style={{ flexDirection: 'row' }}>
              <IconButton
                name="minus"
                label={copy.fontSmaller}
                onPress={() =>
                  setFields((current) => ({
                    ...current,
                    fontSize: Math.max(12, current.fontSize - 1),
                  }))
                }
              />
              <IconButton
                name="plus"
                label={copy.fontLarger}
                onPress={() =>
                  setFields((current) => ({
                    ...current,
                    fontSize: Math.min(28, current.fontSize + 1),
                  }))
                }
              />
            </View>
          </View>
          <T size={13} bold>
            {copy.heading}
          </T>
          <Segments
            value={String(fields.headingLevel)}
            options={[
              { value: '0', label: copy.none },
              { value: '1', label: 'H1' },
              { value: '2', label: 'H2' },
              { value: '3', label: 'H3' },
            ]}
            onChange={(value) =>
              setFields((current) => ({ ...current, headingLevel: Number(value) }))
            }
          />
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {(
              [
                ['isBold', copy.bold, 'bold'],
                ['isItalic', copy.italic, 'italic'],
                ['isUnderline', copy.underline, 'underline'],
                ['isStrike', copy.strike, 'minus'],
              ] as const
            ).map(([key, label, icon]) => (
              <Button
                key={key}
                title={label}
                icon={icon}
                variant={fields[key] ? 'primary' : 'secondary'}
                onPress={() => setFields((current) => ({ ...current, [key]: !current[key] }))}
              />
            ))}
          </View>
          <T size={13} bold>
            {copy.list}
          </T>
          <Segments
            value={fields.listMode}
            options={[
              { value: 'none', label: copy.none },
              { value: 'bullet', label: copy.bullet },
              { value: 'numbered', label: copy.numbered },
              { value: 'todo', label: copy.todo },
            ]}
            onChange={(listMode) => setFields((current) => ({ ...current, listMode }))}
          />
          <T size={13} bold>
            {copy.color}
          </T>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {sourceNoteColorKeys.map((textColorKey) => (
              <Pressable
                key={textColorKey}
                accessibilityRole="radio"
                accessibilityLabel={copy.color}
                accessibilityState={{ selected: fields.textColorKey === textColorKey }}
                onPress={() => setFields((current) => ({ ...current, textColorKey }))}
                style={{
                  width: 48,
                  height: 48,
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: 10,
                  borderColor: fields.textColorKey === textColorKey ? p.primary : p.line,
                  borderWidth: fields.textColorKey === textColorKey ? 3 : 1,
                }}
              >
                <View
                  style={{
                    width: 28,
                    height: 28,
                    backgroundColor: noteColors[textColorKey],
                    borderRadius: 7,
                  }}
                />
              </Pressable>
            ))}
          </View>
        </View>
      </Sheet>
      <Sheet
        visible={showMetadata}
        title={t('inline.AyahNotesScreen.017eeb0ddc')}
        translateTitle={false}
        avoidKeyboard
        onClose={() => setShowMetadata(false)}
        footer={
          <Button
            title={copy.save}
            icon="check"
            loading={busy}
            disabled={busy}
            onPress={onSavePress}
          />
        }
      >
        <View style={{ gap: 12 }}>
          {error && <Notice error message={error} />}
          <NoteTargetControl
            target={noteTarget}
            onChange={(target) => setFields((current) => ({ ...current, target }))}
          />
          <Field
            label={copy.folder}
            value={fields.folder}
            onChangeText={(folder) => setFields((current) => ({ ...current, folder }))}
            placeholder={copy.folder}
          />
          <Field
            label={copy.tags}
            value={fields.tags}
            onChangeText={(tags) => setFields((current) => ({ ...current, tags }))}
            placeholder={copy.tags}
          />
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {editor.tagSuggestions.map((tag) => (
              <Pressable
                key={tag}
                accessibilityRole="button"
                onPress={() =>
                  setFields((current) => ({
                    ...current,
                    tags: toggleTag(current.tags, tag),
                  }))
                }
                style={{
                  paddingHorizontal: 12,
                  minHeight: 40,
                  justifyContent: 'center',
                  borderRadius: 20,
                  backgroundColor: noteTagList(fields.tags).some(
                    (value) => value.toLowerCase() === tag.toLowerCase(),
                  )
                    ? p.lime
                    : p.subtle,
                }}
              >
                <T size={13} bold color={p.primary}>
                  {tag}
                </T>
              </Pressable>
            ))}
          </View>
          <Pressable
            accessibilityRole="checkbox"
            accessibilityState={{ checked: fields.isPinned }}
            onPress={() => setFields((current) => ({ ...current, isPinned: !current.isPinned }))}
            style={{ minHeight: 48, flexDirection: 'row', alignItems: 'center', gap: 10 }}
          >
            <Icon name="bookmark" color={fields.isPinned ? p.primary : p.muted} />
            <T>{copy.pinnedLabel}</T>
          </Pressable>
          {activeNote && (
            <Button
              title={copy.delete}
              icon="trash-2"
              variant="danger"
              onPress={() => deleteNote(activeNote.id)}
            />
          )}
        </View>
      </Sheet>
    </Screen>
  );
}
