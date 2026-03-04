# Superteam Academy — CMS Guide

This guide explains how to manage course content using the Sanity CMS.

## Content Hierarchy

Superteam Academy uses a three-level hierarchy for content:

1.  **Course**: The top-level container (e.g., "Anchor Fundamentals").
2.  **Module**: A group of related lessons within a course.
3.  **Lesson**: The individual piece of content (Video, Reading, or Challenge).

## Schema Definitions

### 1. Course

- **Title**: Name of the course.
- **Slug**: URL identifier (e.g., `anchor-fundamentals`).
- **Description**: Short summary of what students will learn.
- **Difficulty**: Beginner, Intermediate, or Advanced.
- **Track**: Development, Infrastructure, Security, etc.
- **XP**: Total XP awarded for completing the entire course.
- **Badge**: Identifier for the achievement/badge awarded.
- **Prerequisites**: Other courses required before enrolling.

### 2. Module

- **Title**: Name of the module.
- **Order**: Numeric sequence ID.

### 3. Lesson

- **Title**: Name of the lesson.
- **Type**:
  - `video`: Embeddable video content.
  - `reading`: Markdown-based text content.
  - `challenge`: Interactive coding challenge using the IDE.
- **Duration**: Estimated time to complete (e.g., "10 mins").
- **Content**: The main body text (Markdown).
- **Starter Code**: Initial code for challenges.
- **Solution**: The correct code for reference.
- **XP Reward**: XP awarded specifically for this lesson.

## Publishing Workflow

1.  **Create/Edit**: Log in to the Sanity Studio and navigate to the desired document type.
2.  **Drafts**: Changes are saved as drafts automatically.
3.  **Publish**: Click the "Publish" button to make content live on the production site.
4.  **CDN**: Content may take a few minutes to update globally due to the Sanity CDN cache.

## Content Guidelines

- **Markdown**: Use semantic HTML/Markdown in the `content` field for lessons.
- **Images**: Use the Sanity asset uploader; the frontend automatically optimizes them.
- **Challenges**: Ensure `testCases` are defined correctly for the Code Editor to validate user submissions.
