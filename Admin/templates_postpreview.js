import React from 'react';

const PostPreview = ({ entry, widgetFor }) => {
  const title = entry.getIn(['data', 'title']);
  const body = widgetFor('body');

  return (
    <div className="post-preview">
      <h1>{title}</h1>
      <div className="content">{body}</div>
    </div>
  );
};

export default PostPreview;
