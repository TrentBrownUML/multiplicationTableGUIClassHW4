## Multiplication Table Generator (HW4)

This project implements the HW4 requirements for COMP 4610 GUI I. The app layers the jQuery Validation plugin with jQuery UI sliders and tabs to create a fully interactive multiplication table generator.

### Live Demo
- [Click here](https://trentbrownuml.github.io/multiplicationTableGUIClassHW3/)

### Key Features
- **jQuery Validation plugin** enforces integer ranges (-50 to 50), provides tailored error text, and prevents table creation until every field is valid.
- **jQuery UI sliders** are two-way bound to each numeric field; moving a slider updates its input and vice versa.
- **Live preview** table regenerates automatically whenever any slider/input changes and the form is valid.
- **jQuery UI tabs** capture every saved table in its own tab labeled with the four range parameters.
- **Tab management tools** let you close individual tabs via an inline close button or bulk-delete multiple saved tables at once.

### Running Locally
1. Clone or download the repository.
2. Open `index.html` in any modern browser with JavaScript enabled.
3. Adjust the sliders or type values, then click **Save Table to New Tab** to capture the current preview.

### Testing Checklist
- Attempt to submit with invalid data to confirm the plugin blocks submission and highlights the exact fields.
- Drag each slider and ensure the associated input updates instantly.
- Type new values and watch the slider thumb follow the text entry.
- Confirm the preview table updates without a page refresh whenever values change.
- Save multiple tables, close them individually, and use the bulk delete control to remove several tabs together.
