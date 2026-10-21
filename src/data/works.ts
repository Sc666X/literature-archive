import { Work } from '../types';
/**
 * Эти работы будут видны ВСЕМ посетителям сайта.
 * 1. Положите файл (например, story.docx) в папку public/library/
 * 2. Добавьте объект в массив ниже, указав filePath: 'story.docx'
 */
export const defaultAiWorks: Work[] = [
  {
    id: 'mirror-world',
    title: 'Альтернативная история: Мир Разломанного Зеркала',
    description: 'Что, если бы история пошла по другому пути? Этот рассказ погружает вас в мир, где одно событие изменило всё.',
    date: '21.10.2026',
    fileName: 'mirror-world.docx',
    filePath: 'mirror-world.docx', // Это заставит ридер искать файл в public/library/
  },
];
