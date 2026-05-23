# Markdown Editor Component

## Overview
The `MarkdownEditor` component is a rich text editor built with `react-quill` that allows users to create and format content with Markdown-like features. It's integrated into the CreateQuestion page to provide a better user experience for writing detailed question descriptions.

## Features
- **Rich Text Formatting**: Bold, italic, underline, strikethrough
- **Headers & Lists**: Support for headings (H1-H3), ordered lists, bullet lists
- **Code Support**: Inline code and code blocks
- **Quotes**: Block quotes for formatting important text
- **Media**: Insert links, images, and videos
- **Color & Alignment**: Text color, background color, and text alignment
- **Styling**: Consistent with Ant Design theme

## Installation
The component requires `react-quill` to be installed:
```bash
npm install react-quill --legacy-peer-deps
```

## Usage

### Basic Import
```typescript
import MarkdownEditor from '../components/MarkdownEditor';
```

### Component Props
```typescript
interface MarkdownEditorProps {
  value: string;              // Current editor content
  onChange: (value: string) => void;  // Callback when content changes
  placeholder?: string;       // Placeholder text (optional)
  readOnly?: boolean;        // Read-only mode (optional, default: false)
}
```

### Example Usage
```typescript
import { useState } from 'react';
import MarkdownEditor from '../components/MarkdownEditor';

function MyComponent() {
  const [content, setContent] = useState('');

  const handleSubmit = () => {
    console.log('Content:', content);
  };

  return (
    <div>
      <h2>Write Your Content</h2>
      <MarkdownEditor 
        value={content}
        onChange={setContent}
        placeholder="Start typing..."
      />
      <button onClick={handleSubmit}>Submit</button>
    </div>
  );
}
```

### In CreateQuestion Page
The editor is used to capture detailed question descriptions:
```typescript
const [description, setDescription] = useState('');

<MarkdownEditor 
  value={description}
  onChange={setDescription}
  placeholder="Mô tả chi tiết vấn đề, những gì bạn đã thử và kết quả mong muốn..." 
/>
```

## Toolbar Options
The editor includes the following formatting tools:
1. **Headers**: H1, H2, H3, Normal text
2. **Text Formatting**: Bold, Italic, Underline, Strikethrough
3. **Quotes & Code**: Block quotes, Code blocks
4. **Lists**: Ordered lists, Bullet lists
5. **Indentation**: Increase/Decrease indent
6. **Font Size**: Small, Normal, Large, Huge
7. **Colors**: Text color, Background color
8. **Alignment**: Left, Center, Right, Justify
9. **Media**: Links, Images, Videos
10. **Clear Formatting**: Remove all formatting

## Styling
The component comes with custom CSS styling (`MarkdownEditor.css`) that:
- Matches Ant Design color scheme (primary blue: #1890ff)
- Provides consistent toolbar styling
- Includes focus states for better UX
- Handles placeholder text styling

## Output Format
The editor outputs HTML content by default. If you need plain text or Markdown format, you can:
1. Convert HTML to Markdown using a library like `html-to-markdown`
2. Or parse the HTML on the backend before storing

## Integration with Ant Design Forms
Since `react-quill` is a custom component, it requires special handling with Ant Design Form:
- Don't use Form.Item wrapper directly
- Manage editor state separately using useState
- Validate the editor value before form submission
- Pass the editor value directly to your API requests

## Performance Considerations
- The editor lazy-loads heavy dependencies
- CSS files are imported as-needed
- Consider using code-splitting for bundle optimization if the editor is only used on specific pages

## Browser Support
- Modern browsers (Chrome, Firefox, Safari, Edge)
- Requires JavaScript enabled
- Works on desktop and tablet devices
- Mobile support may vary depending on input method

## Customization
To customize the editor:
1. **Modify Toolbar**: Edit the `modules` object in MarkdownEditor.tsx
2. **Change Formats**: Update the `formats` array
3. **Styling**: Edit MarkdownEditor.css to match your design
4. **Height**: Adjust the height in the style prop of ReactQuill component

## Example: Read-Only Mode
```typescript
<MarkdownEditor 
  value={content}
  onChange={() => {}}  // No-op function
  readOnly={true}
/>
```

This displays the formatted content without allowing edits.
