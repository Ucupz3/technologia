import defaultTheme from 'tailwindcss/defaultTheme';
import forms from '@tailwindcss/forms';

/** @type {import('tailwindcss').Config} */
export default {
    darkMode: 'class',
    content: [
        './vendor/laravel/framework/src/Illuminate/Pagination/resources/views/*.blade.php',
        './storage/framework/views/*.php',
        './resources/views/**/*.blade.php',
        './resources/js/**/*.jsx',
    ],

    theme: {
        extend: {
            fontFamily: {
                sans: ['Figtree', ...defaultTheme.fontFamily.sans],
            },
            colors: {
                brand: {
                    primary:        'rgb(var(--brand-primary) / <alpha-value>)',
                    secondary:      'rgb(var(--brand-secondary) / <alpha-value>)',
                    tertiary:       'rgb(var(--brand-tertiary) / <alpha-value>)',
                    border:         'rgb(var(--brand-border) / <alpha-value>)',
                    muted:          'rgb(var(--brand-muted) / <alpha-value>)',
                    accent:         'rgb(var(--brand-accent) / <alpha-value>)',
                    accent2:        'rgb(var(--brand-accent2) / <alpha-value>)',
                    text:           'rgb(var(--brand-text) / <alpha-value>)',
                    'text-muted':   'rgb(var(--brand-text-muted) / <alpha-value>)',
                    white:          'rgb(var(--brand-white) / <alpha-value>)',
                },
            },
        },
    },

    plugins: [forms],
};