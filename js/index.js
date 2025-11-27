/*
Author: Trent Brown (GitHub: TrentBrownUML)
File: js/index.js - HW4 dynamic table, validation, sliders, and tab UI
*/

const SLIDER_MIN = -50;
const SLIDER_MAX = 50;
const sliderPairs = [
    { inputSelector: '#minimumColumnValue', sliderSelector: '#slider-minimumColumnValue' },
    { inputSelector: '#maximumColumnValue', sliderSelector: '#slider-maximumColumnValue' },
    { inputSelector: '#minimumRowValue', sliderSelector: '#slider-minimumRowValue' },
    { inputSelector: '#maximumRowValue', sliderSelector: '#slider-maximumRowValue' }
];

let isSyncingFromInput = false;
let tabIdCounter = 0;
const savedTabs = new Map(); // id -> label text for multi-delete panel

$(function initApplication() {
    const $form = $('#multiplicationForm');
    const $tabs = $('#tableTabs');
    const $previewContainer = $('#livePreviewContainer');
    const $deleteSelectedButton = $('#deleteSelectedTabs');
    const $tabSelectionList = $('#tabSelectionList');

    const updatePreview = debounce(() => refreshLivePreview($form, $previewContainer), 150);

    $tabs.tabs();
    initializeValidation($form, updatePreview);
    initializeSliders(updatePreview);
    hookInputSync($form, updatePreview);
    refreshLivePreview($form, $previewContainer);

    $form.on('submit', (event) => {
        event.preventDefault();
        if (!$form.valid()) {
            return;
        }
        const values = getNumericValues($form);
        addTableTab(values, $tabs);
        renderTabSelectionList($tabSelectionList, $deleteSelectedButton);
        setTimeout(() => $tabs.tabs('option', 'active', $tabs.find('> ul > li').length - 1), 0);
    });

    $tabs.on('click', '.tab-close', (event) => {
        const tabId = $(event.currentTarget).data('tabTarget');
        deleteTabs([tabId], $tabs);
        renderTabSelectionList($tabSelectionList, $deleteSelectedButton);
    });

    $tabSelectionList.on('change', 'input[type="checkbox"]', () => {
        const hasSelection = $tabSelectionList.find('input[type="checkbox"]:checked').length > 0;
        $deleteSelectedButton.prop('disabled', !hasSelection);
    });

    $deleteSelectedButton.on('click', () => {
        const ids = $tabSelectionList.find('input[type="checkbox"]:checked')
            .map((_, el) => el.value)
            .get();
        if (!ids.length) return;
        deleteTabs(ids, $tabs);
        renderTabSelectionList($tabSelectionList, $deleteSelectedButton);
    });
});

function initializeValidation($form, onValidChange) {
    $.validator.addMethod('withinSliderRange', (value, element) => {
        if (value === '') return false;
        const numericValue = Number(value);
        return Number.isInteger(numericValue) && numericValue >= SLIDER_MIN && numericValue <= SLIDER_MAX;
    }, `Enter an integer between ${SLIDER_MIN} and ${SLIDER_MAX}.`);

    $.validator.addMethod('greaterThanOrEqualTo', (value, element, selector) => {
        const compareValue = Number($(selector).val());
        if (value === '' || Number.isNaN(compareValue)) return true;
        return Number(value) >= compareValue;
    }, 'Value must be greater than or equal to the minimum.');

    const validator = $form.validate({
        rules: {
            minimumColumnValue: {
                required: true,
                withinSliderRange: true
            },
            maximumColumnValue: {
                required: true,
                withinSliderRange: true,
                greaterThanOrEqualTo: '#minimumColumnValue'
            },
            minimumRowValue: {
                required: true,
                withinSliderRange: true
            },
            maximumRowValue: {
                required: true,
                withinSliderRange: true,
                greaterThanOrEqualTo: '#minimumRowValue'
            }
        },
        messages: {
            minimumColumnValue: {
                required: 'Please provide a minimum column value.'
            },
            maximumColumnValue: {
                required: 'Please provide a maximum column value.',
                greaterThanOrEqualTo: 'Column max must be greater than or equal to the column min.'
            },
            minimumRowValue: {
                required: 'Please provide a minimum row value.'
            },
            maximumRowValue: {
                required: 'Please provide a maximum row value.',
                greaterThanOrEqualTo: 'Row max must be greater than or equal to the row min.'
            }
        },
        errorElement: 'span',
        errorClass: 'field-error',
        highlight(element) {
            $(element).addClass('has-error');
        },
        unhighlight(element) {
            $(element).removeClass('has-error');
        },
        errorPlacement(error, element) {
            const $field = element.closest('.field');
            error.appendTo($field);
        },
        ignore: []
    });

    $form.on('keyup change input', 'input', () => {
        if (validator.pendingRequest) return;
        if ($form.valid()) {
            onValidChange();
        }
    });
}

function initializeSliders(onSlideCallback) {
    sliderPairs.forEach(({ inputSelector, sliderSelector }) => {
        const $input = $(inputSelector);
        const $slider = $(sliderSelector);
        const initialValue = clampToSliderRange(Number($input.val()) || 0);
        $slider.slider({
            min: SLIDER_MIN,
            max: SLIDER_MAX,
            value: initialValue,
            slide: (_, ui) => handleSliderDrivenChange($input, ui.value, onSlideCallback),
            change: (_, ui) => handleSliderDrivenChange($input, ui.value, onSlideCallback)
        });
        $input.val(initialValue);
    });
}

function handleSliderDrivenChange($input, value, onSlideCallback) {
    if (isSyncingFromInput) return;
    $input.val(value);
    onSlideCallback();
}

function hookInputSync($form, onValueChange) {
    sliderPairs.forEach(({ inputSelector, sliderSelector }) => {
        const $input = $(inputSelector);
        const $slider = $(sliderSelector);

        $input.on('input change', () => {
            const numericValue = Number($input.val());
            if (!Number.isInteger(numericValue)) {
                onValueChange();
                return;
            }
            const clamped = clampToSliderRange(numericValue);
            if (clamped !== numericValue) {
                $input.val(clamped);
            }
            isSyncingFromInput = true;
            $slider.slider('value', clamped);
            isSyncingFromInput = false;
            onValueChange();
        });
    });

    // Trigger initial sync so preview and sliders align with default values
    $form.find('input').trigger('change');
}

function refreshLivePreview($form, $previewContainer) {
    if (!$form.valid()) {
        showPreviewPlaceholder($previewContainer, 'Correct the highlighted values to see the table preview.');
        return;
    }
    const values = getNumericValues($form);
    const table = buildTableFragment(values.minimumColumnValue, values.maximumColumnValue, values.minimumRowValue, values.maximumRowValue);
    renderTableInContainer($previewContainer, table);
}

function showPreviewPlaceholder($previewContainer, text) {
    $previewContainer.empty().append(`<p class="placeholder">${text}</p>`);
}

function renderTableInContainer($container, table) {
    $container.empty().append(table);
}

function addTableTab(values, $tabs) {
    const tabId = `table-tab-${++tabIdCounter}`;
    const label = formatTabLabel(values);
    const $tabList = $tabs.find('> ul');
    const $tabHeader = $(`<li data-tab-id="${tabId}"><a href="#${tabId}">${label}</a><button type="button" class="tab-close" aria-label="Close ${label}" data-tab-target="${tabId}">&times;</button></li>`);
    const $panel = $(`<div id="${tabId}" class="tab-panel"></div>`);
    const table = buildTableFragment(values.minimumColumnValue, values.maximumColumnValue, values.minimumRowValue, values.maximumRowValue);
    const tableWrapper = $('<div class="table-container"></div>').append(table);
    $panel.append(`<p class="preview-hint">${label}</p>`).append(tableWrapper);

    $tabList.append($tabHeader);
    $tabs.append($panel);
    $tabs.tabs('refresh');
    savedTabs.set(tabId, label);
}

function deleteTabs(tabIds, $tabs) {
    tabIds.forEach((tabId) => {
        if (!savedTabs.has(tabId)) return;
        $tabs.find(`> ul > li[data-tab-id="${tabId}"]`).remove();
        $tabs.find(`#${tabId}`).remove();
        savedTabs.delete(tabId);
    });
    $tabs.tabs('refresh');
}

function renderTabSelectionList($listContainer, $deleteButton) {
    $listContainer.empty();
    if (!savedTabs.size) {
        $listContainer.append('<p class="placeholder">No saved tables yet.</p>');
        $deleteButton.prop('disabled', true);
        return;
    }

    savedTabs.forEach((label, tabId) => {
        const $item = $(`<div class="tab-selection-item"><input type="checkbox" id="select-${tabId}" value="${tabId}"><label for="select-${tabId}">${label}</label></div>`);
        $listContainer.append($item);
    });
    $deleteButton.prop('disabled', true);
}

function getNumericValues($form) {
    return {
        minimumColumnValue: Number($form.find('#minimumColumnValue').val()),
        maximumColumnValue: Number($form.find('#maximumColumnValue').val()),
        minimumRowValue: Number($form.find('#minimumRowValue').val()),
        maximumRowValue: Number($form.find('#maximumRowValue').val())
    };
}

function formatTabLabel(values) {
    const { minimumColumnValue: cMin, maximumColumnValue: cMax, minimumRowValue: rMin, maximumRowValue: rMax } = values;
    return `Cols ${cMin}..${cMax} x Rows ${rMin}..${rMax}`;
}

function clampToSliderRange(value) {
    if (!Number.isInteger(value)) return 0;
    return Math.min(SLIDER_MAX, Math.max(SLIDER_MIN, value));
}

function debounce(callback, delay = 150) {
    let timer = null;
    return (...args) => {
        clearTimeout(timer);
        timer = setTimeout(() => callback(...args), delay);
    };
}

function buildTableFragment(columnMin, columnMax, rowMin, rowMax) {
    let cMin = Math.trunc(columnMin);
    let cMax = Math.trunc(columnMax);
    let rMin = Math.trunc(rowMin);
    let rMax = Math.trunc(rowMax);

    if (![cMin, cMax, rMin, rMax].every(Number.isFinite)) {
        const err = document.createElement('div');
        err.textContent = 'Invalid range values';
        return err;
    }

    if (cMin > cMax) [cMin, cMax] = [cMax, cMin];
    if (rMin > rMax) [rMin, rMax] = [rMax, rMin];

    const table = document.createElement('table');
    table.className = 'generatedTable';

    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');
    const topLeft = document.createElement('th');
    topLeft.setAttribute('scope', 'col');
    headerRow.appendChild(topLeft);
    for (let c = cMin; c <= cMax; c += 1) {
        const th = document.createElement('th');
        th.setAttribute('scope', 'col');
        th.textContent = String(c);
        headerRow.appendChild(th);
    }
    thead.appendChild(headerRow);
    table.appendChild(thead);

    const tbody = document.createElement('tbody');
    for (let r = rMin; r <= rMax; r += 1) {
        const tr = document.createElement('tr');
        const rowHeader = document.createElement('th');
        rowHeader.setAttribute('scope', 'row');
        rowHeader.textContent = String(r);
        tr.appendChild(rowHeader);
        for (let c = cMin; c <= cMax; c += 1) {
            const td = document.createElement('td');
            td.textContent = String(r * c);
            tr.appendChild(td);
        }
        tbody.appendChild(tr);
    }
    table.appendChild(tbody);
    return table;
}