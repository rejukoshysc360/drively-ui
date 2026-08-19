'use client';
import React, { useCallback, useMemo, useRef, useState, useEffect } from 'react';
import { Editable, ReactEditor, Slate, withReact } from 'slate-react';
import { createEditor, Transforms, Editor, Text, BaseEditor } from 'slate';
import { HistoryEditor } from 'slate-history';
import {
  FaBold,
  FaItalic,
  FaUnderline,
  FaCode,
  FaListUl,
  FaAlignLeft,
  FaAlignCenter,
  FaAlignRight,
  FaImage,
} from 'react-icons/fa';
import { useAnnouncementImageUrl, useUploadAnnouncementImage } from './hooks';

/* -------------------------------------------------------------------------- */
/*                                   Toolbar                                  */
/* -------------------------------------------------------------------------- */

const Toolbar = ({ editor }) => {
  const [selectedHeading, setSelectedHeading] = useState('normal');
  const uploadImage = useUploadAnnouncementImage();
  const getImageUrl = useAnnouncementImageUrl();

  const handleToggleMark = (format: string) => {
    CustomEditor.toggleMark(editor, format);
  };

  const handleToggleBlock = (format: string) => {
    const isActive = CustomEditor.isBlockActive(editor, format);

    if (format.startsWith('heading-') && CustomEditor.isBlockActive(editor, 'bulleted-list')) {
      Transforms.wrapNodes(editor, { type: format, children: [] }, { match: (n) => Editor.isBlock(editor, n) });
    } else {
      if (isActive) {
        Transforms.unwrapNodes(editor, { match: (n) => n.type === format });
      } else {
        Transforms.wrapNodes(editor, { type: format, children: [] }, { match: (n) => Editor.isBlock(editor, n) });
      }
    }
  };

  const handleIncreaseFont = () => CustomEditor.increaseFont(editor);
  const handleDecreaseFont = () => CustomEditor.decreaseFont(editor);
  const handleAlignText = (alignment: string) => CustomEditor.setAlignment(editor, alignment);

  const handleInsertImage = async (file) => {
    if (!file) return;
    try {
      // Step 1️⃣ Upload image to S3
      const { key } = await uploadImage.mutateAsync(file);

      // Step 2️⃣ Try to resolve presigned URL instantly (for preview)
      let previewUrl = null;
      try {
        const { url } = await getImageUrl.mutateAsync(key);
        previewUrl = url;
      } catch (err) {
        console.warn("Presigned URL fetch failed (will show placeholder):", err);
      }

      // Step 3️⃣ Insert with presigned URL (for preview),
      // but still mark it with data-s3key so it saves correctly
      const displayUrl = previewUrl || `data-s3key:${key}`;
      CustomEditor.insertImage(editor, displayUrl);
    } catch (err) {
      console.error("Upload failed:", err);
    }
  };

  const handleHeadingChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedOption = e.target.value;
    for (const level of ['1', '2', '3', '4', '5', '6']) {
      Transforms.unwrapNodes(editor, { match: (n) => n.type === `heading-${level}` });
    }
    if (selectedOption !== 'normal') {
      handleToggleBlock(`heading-${selectedOption}`);
    }
    setSelectedHeading(selectedOption);
  };

  return (
    <div className="sc-editor-toolbar flex flex-wrap gap-2 mb-3 border-b pb-2">
      <select
        onChange={handleHeadingChange}
        value={selectedHeading}
        className="border rounded px-2 py-1 text-sm"
      >
        <option value="normal">Normal Text</option>
        <option value="1">Heading 1</option>
        <option value="2">Heading 2</option>
        <option value="3">Heading 3</option>
        <option value="4">Heading 4</option>
        <option value="5">Heading 5</option>
        <option value="6">Heading 6</option>
      </select>

      <button onMouseDown={(e) => (e.preventDefault(), handleToggleMark('bold'))}><FaBold /></button>
      <button onMouseDown={(e) => (e.preventDefault(), handleToggleMark('italic'))}><FaItalic /></button>
      <button onMouseDown={(e) => (e.preventDefault(), handleToggleMark('underline'))}><FaUnderline /></button>

      <button onClick={handleIncreaseFont}>A+</button>
      <button onClick={handleDecreaseFont}>A-</button>

      <button onMouseDown={(e) => (e.preventDefault(), handleToggleBlock('code'))}><FaCode /></button>
      <button onMouseDown={(e) => (e.preventDefault(), handleToggleBlock('bulleted-list'))}><FaListUl /></button>

      <button onMouseDown={(e) => (e.preventDefault(), handleAlignText('left'))}><FaAlignLeft /></button>
      <button onMouseDown={(e) => (e.preventDefault(), handleAlignText('center'))}><FaAlignCenter /></button>
      <button onMouseDown={(e) => (e.preventDefault(), handleAlignText('right'))}><FaAlignRight /></button>

      <label className="cursor-pointer">
        <FaImage />
        <input
          type="file"
          accept="image/*"
          onChange={(e) => handleInsertImage(e.target.files?.[0])}
          className="hidden"
        />
      </label>
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/*                                   Types                                    */
/* -------------------------------------------------------------------------- */

type CustomText = {
  text: string;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  code?: boolean;
  fontSize?: number;
};

type CustomElement =
  | { type: 'paragraph' | 'heading-one' | 'code' | 'bulleted-list'; children: CustomText[] }
  | { type: 'image'; url: string; children: CustomText[] };

declare module 'slate' {
  interface CustomTypes {
    Editor: BaseEditor & ReactEditor & HistoryEditor;
    Element: CustomElement;
    Text: CustomText;
  }
}

/* -------------------------------------------------------------------------- */
/*                              Custom Editor API                             */
/* -------------------------------------------------------------------------- */

const CustomEditor = {
  toggleMark: (editor, format) => {
    const isActive = CustomEditor.isMarkActive(editor, format);
    Transforms.setNodes(
      editor,
      { [format]: isActive ? null : true },
      { match: (n) => Text.isText(n), split: true }
    );
  },
  isMarkActive: (editor, format) => {
    const [match] = Editor.nodes(editor, { match: (n) => n[format] === true, universal: true });
    return !!match;
  },
  increaseFont: (editor) => {
    const [match] = Editor.nodes(editor, { match: (n) => Editor.isBlock(editor, n) });
    if (match) {
      const [node, path] = match;
      Transforms.setNodes(editor, { fontSize: (node.fontSize || 16) + 2 }, { at: path });
    }
  },
  decreaseFont: (editor) => {
    const [match] = Editor.nodes(editor, { match: (n) => Editor.isBlock(editor, n) });
    if (match) {
      const [node, path] = match;
      Transforms.setNodes(editor, { fontSize: Math.max((node.fontSize || 16) - 2, 1) }, { at: path });
    }
  },
  setAlignment: (editor, alignment) => {
    Transforms.setNodes(editor, { alignment }, { match: (n) => Editor.isBlock(editor, n) });
  },
  insertImage: (editor, url: string) => {
    // ✅ Ensure editor has a valid focus/selection before inserting
    if (!editor.selection) {
      ReactEditor.focus(editor);
      Transforms.select(editor, Editor.end(editor, []));
    }

    const image = { type: 'image', url, children: [{ text: '' }] };
    Transforms.insertNodes(editor, image);

    // ✅ Automatically insert a paragraph after image so user can type below
    Transforms.insertNodes(editor, {
      type: 'paragraph',
      children: [{ text: '' }],
    });

    // ✅ Move cursor after the inserted paragraph
    Transforms.move(editor);
  }, 
  isBlockActive: (editor, format) => {
    const [match] = Editor.nodes(editor, { match: (n) => n.type === format });
    return !!match;
  },
};

/* -------------------------------------------------------------------------- */
/*                        Lightweight HTML → Slate parser                     */
/* -------------------------------------------------------------------------- */

const parseHtmlToSlate = (html: string) => {
  const temp = document.createElement('div');
  temp.innerHTML = html;
  const nodes: any[] = [];

  temp.childNodes.forEach((node) => {
    if (node.nodeName === 'IMG') {
      nodes.push({
        type: 'image',
        url: (node as HTMLImageElement).src,
        children: [{ text: '' }],
      });
    } else if (node.nodeName === 'P') {
      nodes.push({
        type: 'paragraph',
        children: [{ text: node.textContent || '' }],
      });
    } else {
      nodes.push({
        type: 'paragraph',
        children: [{ text: node.textContent || '' }],
      });
    }
  });

  return nodes.length ? nodes : [{ type: 'paragraph', children: [{ text: '' }] }];
};

/* -------------------------------------------------------------------------- */
/*                                  Elements                                  */
/* -------------------------------------------------------------------------- */

const Leaf = (props) => (
  <span
    {...props.attributes}
    style={{
      fontWeight: props.leaf.bold ? 'bold' : 'normal',
      fontStyle: props.leaf.italic ? 'italic' : 'normal',
      textDecoration: props.leaf.underline ? 'underline' : 'none',
      fontFamily: props.leaf.code ? 'monospace' : 'inherit',
      fontSize: props.leaf.fontSize ? `${props.leaf.fontSize}px` : 'inherit',
    }}
  >
    {props.children}
  </span>
);

const Element = (props) => {
  const { attributes, children, element } = props;

  switch (element.type) {
    case 'paragraph':
      return <p style={{ textAlign: element.alignment }} {...attributes}>{children}</p>;
    case 'code':
      return <pre style={{ textAlign: element.alignment }} {...attributes}>{children}</pre>;
    case 'bulleted-list':
      return <ul style={{ textAlign: element.alignment }} className="list-disc" {...attributes}><li>{children}</li></ul>;
    case 'image':
      return <img src={element.url} alt="Uploaded" {...attributes} />;
    default:
      return <p {...attributes}>{children}</p>;
  }
};

/* -------------------------------------------------------------------------- */
/*                                  Main Editor                               */
/* -------------------------------------------------------------------------- */

const SlateEditor = ({ value = '', onChange }) => {
  const editorRef = useRef(null);
  const editor = useMemo(() => withReact(createEditor()), []);

  editorRef.current = editor;

  const renderElement = useCallback((props) => <Element {...props} />, []);
  const renderLeaf = useCallback((props) => <Leaf {...props} />, []);

  const initialValue = useMemo(() => {
    if (value && value.trim().startsWith('<')) {
      return parseHtmlToSlate(value);
    }
    return [{ type: 'paragraph', children: [{ text: value || '' }] }];
  }, [value]);

  // ✅ ADD THESE LINES — stable internal state so delete works
  const [editorValue, setEditorValue] = useState(initialValue);
  useEffect(() => {
    setEditorValue(initialValue);
  }, [initialValue]);
  // ✅ END FIX

  const serialize = (node) => {
    if (Text.isText(node)) {
      let text = node.text;
      if (node.bold) text = `<strong>${text}</strong>`;
      if (node.italic) text = `<em>${text}</em>`;
      if (node.underline) text = `<u>${text}</u>`;
      return text;
    }
    const children = node.children.map((n) => serialize(n)).join('');
    switch (node.type) {
      case 'paragraph':
        return `<p>${children}</p>`;
      case 'code':
        return `<pre><code>${children}</code></pre>`;
      case 'bulleted-list':
        return `<ul><li>${children}</li></ul>`;
      case 'image':
        return `<img src="${node.url}" alt=""/>`;
      default:
        return children;
    }
  };

  const handleChange = (newValue) => {
    setEditorValue(newValue); // ✅ update local state so typing/deleting works
    const html = newValue.map((n) => serialize(n)).join('');
    onChange?.(html);
  };

  return (
    <div className="border rounded-lg p-3 bg-white">
      {/* ⛔ Removed key={value} */}
      <Slate editor={editor} initialValue={editorValue} onChange={handleChange}>
        <Toolbar editor={editor} />
        <Editable
          className="min-h-[150px] focus:outline-none"
          renderElement={renderElement}
          renderLeaf={renderLeaf}
          placeholder="Type your announcement..."
          // ✅ Enable Backspace/Delete to remove image
          onKeyDown={(event) => {
            const { selection } = editor;
            if (selection && Editor.above(editor, { match: n => n.type === 'image' })) {
              if (event.key === 'Backspace' || event.key === 'Delete') {
                event.preventDefault();
                Transforms.removeNodes(editor, { match: n => n.type === 'image' });
              }
            }
          }}
        />
      </Slate>
    </div>
  );
};

export default SlateEditor;
