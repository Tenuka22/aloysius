declare module "react-image-crop/dist/ReactCrop.css" {}

/**
 * Tiptap owns the `contenteditable` element it renders, so the prose styles
 * for the rich text field cannot be StyleX classes attached in JSX. They are a
 * stylesheet imported for its side effect instead — see
 * `components/cms/rich-text.css`.
 */
declare module "*.css" {}
