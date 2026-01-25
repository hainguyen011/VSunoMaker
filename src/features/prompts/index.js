/**
 * Prompts Feature - Aggregator
 * Unified access to all prompt templates
 */

import { musicPrompts } from './music.js';
import { lyricPrompts } from './lyrics.js';
import { stylePrompts } from './styles.js';

export const Prompts = {
    ...musicPrompts,
    ...lyricPrompts,
    ...stylePrompts
};
