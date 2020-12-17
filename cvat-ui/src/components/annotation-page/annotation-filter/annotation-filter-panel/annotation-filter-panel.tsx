// Copyright (C) 2020 Intel Corporation
//
// SPDX-License-Identifier: MIT

import { QuestionCircleOutlined } from '@ant-design/icons';
import {
    AutoComplete, Button, Cascader, Modal, Radio,
} from 'antd';
import { RadioChangeEvent } from 'antd/lib/radio';
import { SelectValue } from 'antd/lib/select';
import PropTypes from 'prop-types';
import React, {
    ReactElement, useEffect, useReducer, useState,
} from 'react';
import { useSelector } from 'react-redux';
import { AnnotationState, CombinedState } from 'reducers/interfaces';
import './annotation-filter-panel.scss';

interface Props {
    isFirst?: boolean;
    isVisible: boolean;
    onClose: Function;
    onAddNew: Function;
    editItem: any;
}

interface State {
    id: string;
    concatenator: string;
    filterBy: string;
    operator: string;
    value: string;
    attribute: string;
    attributeOperator: string;
    attributeValue: string;
    anotherAttributeLabel: string;
    anotherAttributeValue: string;
    left: string[];
    right: string[];
}
interface MemorizedFilters {
    width?: string[];
    height?: string[];
    serverID?: string[];
    clientID?: string[];
}

enum StateLevels {
    concatenator,
    filterBy,
    operator,
    value,
    attribute,
    attributeOperator,
    attributeValue,
    anotherAttributeLabel,
    anotherAttributeValue,
}

enum ActionType {
    concatenator,
    filterBy,
    operator,
    value,
    attribute,
    attributeOperator,
    attributeValue,
    anotherAttributeLabel,
    anotherAttributeValue,
    fillState,
    partialReset,
    reset,
}

enum ConcatenatorOptionsValues {
    or = '|',
    and = '&',
}

enum FilterByValues {
    label = 'label',
    width = 'width',
    height = 'height',
    serverID = 'serverID',
    clientID = 'clientID',
    type = 'type',
    shape = 'shape',
    occluded = 'occluded',
    attribute = 'attribute',
    emptyFrame = 'empty_frame',
}

enum FilterByTypeValues {
    shape = 'shape',
    track = 'track',
}

enum FilterByShapeValues {
    rectangle = 'rectangle',
    points = 'points',
    polyline = 'polyline',
    polygon = 'polygon',
    cuboids = 'cuboids',
    tag = 'tag',
}

enum OperatorOptionsValues {
    eq = '==',
    neq = '!=',
    gt = '>',
    gte = '>=',
    lt = '<',
    lte = '<=',
}

enum NumericFilterByOptions {
    width,
    height,
    serverID,
    clientID,
}

enum PixelFilterByOptions {
    width,
    height,
}

enum BooleanFilterByOptions {
    occluded,
    empty_frame,
}

const concatenatorOptions: Record<string, string>[] = [
    { label: 'and (&)', value: ConcatenatorOptionsValues.and },
    { label: 'or (|)', value: ConcatenatorOptionsValues.or },
];

const filterByOptions: Record<string, string | FilterByValues>[] = [
    { label: 'Label', value: FilterByValues.label },
    { label: 'Width', value: FilterByValues.width },
    { label: 'Height', value: FilterByValues.height },
    { label: 'Server ID', value: FilterByValues.serverID },
    { label: 'Client ID', value: FilterByValues.clientID },
    { label: 'Type', value: FilterByValues.type },
    { label: 'Shape', value: FilterByValues.shape },
    { label: 'Occluded', value: FilterByValues.occluded },
    { label: 'Attribute', value: FilterByValues.attribute },
    { label: 'Empty Frame', value: FilterByValues.emptyFrame },
];

const filterByBooleanOptions: Record<string, string | boolean>[] = [
    { label: 'True', value: true },
    { label: 'False', value: false },
];

const filterByTypeOptions: Record<string, string>[] = [
    { label: 'Shape', value: FilterByTypeValues.shape },
    { label: 'Track', value: FilterByTypeValues.track },
];

const filterByShapeOptions: Record<string, string>[] = [
    { label: 'Rectangle', value: FilterByShapeValues.rectangle },
    { label: 'Points', value: FilterByShapeValues.points },
    { label: 'Polyline', value: FilterByShapeValues.polyline },
    { label: 'Polygon', value: FilterByShapeValues.polygon },
    { label: 'Cuboids', value: FilterByShapeValues.cuboids },
    { label: 'Tag', value: FilterByShapeValues.tag },
];

const operatorOptions: Record<string, string | boolean>[] = [
    { label: OperatorOptionsValues.eq, value: OperatorOptionsValues.eq, any: true },
    { label: OperatorOptionsValues.neq, value: OperatorOptionsValues.neq, any: true },
    { label: OperatorOptionsValues.gt, value: OperatorOptionsValues.gt, any: false },
    { label: OperatorOptionsValues.gte, value: OperatorOptionsValues.gte, any: false },
    { label: OperatorOptionsValues.lt, value: OperatorOptionsValues.lt, any: false },
    { label: OperatorOptionsValues.lte, value: OperatorOptionsValues.lte, any: false },
];

const reducer = (state: State, action: { type: ActionType; payload?: any }): State => {
    switch (action.type) {
        case ActionType.concatenator:
            return { ...state, concatenator: action.payload };
        case ActionType.filterBy:
            return { ...state, filterBy: action.payload };
        case ActionType.operator:
            return { ...state, operator: action.payload };
        case ActionType.value:
            return { ...state, value: action.payload };
        case ActionType.attribute:
            return { ...state, attribute: action.payload };
        case ActionType.attributeOperator:
            return { ...state, attributeOperator: action.payload };
        case ActionType.attributeValue:
            return { ...state, attributeValue: action.payload };
        case ActionType.anotherAttributeLabel:
            return { ...state, anotherAttributeLabel: action.payload };
        case ActionType.anotherAttributeValue:
            return { ...state, anotherAttributeValue: action.payload };
        case ActionType.fillState:
            return { ...action.payload };
        case ActionType.partialReset:
            if (!action.payload || action.payload.id) return state;
            return {
                ...state,
                operator: action.payload < StateLevels.operator ? '' : state.operator,
                value: action.payload < StateLevels.operator ? '' : state.value,
                attribute: action.payload < StateLevels.attribute ? '' : state.attribute,
                attributeOperator: action.payload < StateLevels.attributeOperator ? '' : state.attributeOperator,
                attributeValue: action.payload < StateLevels.attributeOperator ? '' : state.attributeValue,
                anotherAttributeLabel:
                    action.payload < StateLevels.anotherAttributeLabel &&
                    action.payload !== StateLevels.attributeOperator ?
                        '' :
                        state.anotherAttributeLabel,
                anotherAttributeValue:
                    action.payload < StateLevels.anotherAttributeValue &&
                    action.payload !== StateLevels.attributeOperator ?
                        '' :
                        state.anotherAttributeValue,
            };
        case ActionType.reset:
            return {} as State;
        default:
            return state;
    }
};

const AnnotationFilterPanel = ({
    isFirst, isVisible, onClose, onAddNew, editItem,
}: Props): ReactElement => {
    const [state, dispatch] = useReducer(reducer, {} as State);
    const [editModeInitiated, setEditModeInitiated] = useState(false);
    const annotation: AnnotationState = useSelector((globalState: CombinedState) => globalState.annotation);

    const isAttributeFilterBy = (): boolean => FilterByValues.attribute === state.filterBy;
    const isBooleanFilterBy = (): boolean => Object.values(BooleanFilterByOptions).includes(state.filterBy);
    const isNumericFilterBy = (): boolean => Object.values(NumericFilterByOptions).includes(state.filterBy);
    const isPixelFilterBy = (): boolean => Object.values(PixelFilterByOptions).includes(state.filterBy);

    const getMemorizedFilters = (): MemorizedFilters => JSON.parse(localStorage.getItem('filters') ?? '{}');
    const setMemorizedFilters = (): void => {
        const filters = { ...getMemorizedFilters() };
        filters[state.filterBy] = [state.value, ...(filters[state.filterBy] ?? [])];
        filters[state.filterBy] = filters[state.filterBy]
            .filter((value: string) => value)
            .filter((value: string, index: number, self: string[]) => self.indexOf(value) === index)
            .slice(0, 10);
        localStorage.setItem('filters', JSON.stringify(filters));
    };

    useEffect(() => {
        if (editModeInitiated) return;
        dispatch({ type: ActionType.partialReset, payload: StateLevels.concatenator });
    }, [state.concatenator]);
    useEffect(() => {
        if (editModeInitiated) return;
        dispatch({ type: ActionType.partialReset, payload: StateLevels.filterBy });
    }, [state.filterBy]);
    useEffect(() => {
        if (editModeInitiated) return;
        dispatch({ type: ActionType.partialReset, payload: StateLevels.operator });
    }, [state.operator]);
    useEffect(() => {
        if (editModeInitiated) return;
        dispatch({ type: ActionType.partialReset, payload: StateLevels.value });
    }, [state.value]);
    useEffect(() => {
        if (editModeInitiated) return;
        dispatch({ type: ActionType.partialReset, payload: StateLevels.attribute });
    }, [state.attribute]);
    useEffect(() => {
        if (editModeInitiated) return;
        dispatch({ type: ActionType.partialReset, payload: StateLevels.attributeOperator });
    }, [state.attributeOperator]);
    useEffect(() => {
        if (editModeInitiated) return;
        dispatch({ type: ActionType.partialReset, payload: StateLevels.attributeValue });
    }, [state.attributeValue]);
    useEffect(() => {
        if (editModeInitiated) return;
        dispatch({ type: ActionType.partialReset, payload: StateLevels.anotherAttributeLabel });
    }, [state.anotherAttributeLabel]);
    useEffect(() => {
        if (editModeInitiated) return;
        dispatch({ type: ActionType.partialReset, payload: StateLevels.anotherAttributeValue });
    }, [state.anotherAttributeValue]);

    useEffect(() => {
        setTimeout(() => {
            dispatch({ type: ActionType.reset });
            if (editItem) {
                setEditModeInitiated(true);
                dispatch({ type: ActionType.fillState, payload: editItem });
                setEditModeInitiated(false);
                return;
            }
            if (!isFirst) dispatch({ type: ActionType.concatenator, payload: ConcatenatorOptionsValues.and });
        }, 100);
    }, [isVisible]);

    useEffect(() => {
        if (isNumericFilterBy()) setMemorizedFilters();
        dispatch({ type: ActionType.reset });
        if (!isFirst) dispatch({ type: ActionType.concatenator, payload: ConcatenatorOptionsValues.and });
    }, [onAddNew]);

    const getOperatorOptions = (): Record<string, any>[] => {
        if (!Object.values(NumericFilterByOptions).includes(state.filterBy)) {
            return operatorOptions.filter((option) => option.any);
        }
        return operatorOptions;
    };

    const getValueOptions = (): Record<string, any>[] => {
        switch (state.filterBy) {
            case FilterByValues.label:
            case FilterByValues.attribute:
                return [{ label: 'All', value: 'all' }].concat(
                    ...annotation.job.labels.map((item: Record<string, any>) => ({
                        label: item.name,
                        value: item.name,
                    })),
                );
            case FilterByValues.type:
                return filterByTypeOptions;
            case FilterByValues.shape:
                return filterByShapeOptions;
            case FilterByValues.occluded:
            case FilterByValues.emptyFrame:
                return filterByBooleanOptions;
            default:
                return [];
        }
    };

    const getAttributeOptions = (stateValue: string): Record<string, any>[] => {
        let attributeOptions: Record<string, any>[];
        if (stateValue === 'all') {
            attributeOptions = [].concat(...(Object.values(annotation.job.attributes) as any[]));
        } else {
            attributeOptions =
                annotation.job.labels.find((item: Record<string, any>) => item.name === stateValue)?.attributes ?? [];
        }
        return attributeOptions.map((attr: Record<string, any>) => ({
            label: attr.name,
            value: attr.name,
            type: attr.inputType,
        }));
    };

    const getAttributeOperatorOptions = (): Record<string, any>[] => {
        const currentAttr = getAttributeOptions(state.value).find(
            (attr: Record<string, any>) => attr.label === state.attribute,
        );
        if (currentAttr?.type !== 'number') {
            return operatorOptions.filter((option) => option.any);
        }
        return operatorOptions;
    };

    const getAttributeValueOptions = (): Record<string, any>[] => {
        const valueOptions: any[] = []
            .concat(...(Object.values(annotation.job.attributes) as any[]))
            .find((attr: Record<string, any>) => attr.name === state.attribute)
            ?.values.map((val: any) => ({ label: val.toString(), value: val.toString() }));
        valueOptions.unshift({ label: 'Another attribute', value: 'anotherAttribute' });
        return valueOptions;
    };

    return (
        <Modal
            className='annotation-filters-panel'
            onCancel={() => onClose()}
            visible={isVisible}
            footer={false}
            mask={false}
            width={300}
        >
            <QuestionCircleOutlined className='ant-modal-help' onClick={() => alert('Help')} />
            {!editItem && <h3>Add new filter</h3>}
            {editItem && <h3>Update filter</h3>}
            <div className='filter-option-wrapper'>
                <div className='filter-option'>
                    <span className='filter-option-label concatenator'>
                        {!editItem && 'Add as new '}
                        {editItem && 'Update '}
                        with operator
                    </span>
                    <div className='filter-option-value-wrapper'>
                        <div className='filter-option-value'>
                            <Cascader
                                options={concatenatorOptions}
                                onChange={(value: any) =>
                                    dispatch({ type: ActionType.concatenator, payload: value[0] })}
                                value={[state.concatenator]}
                                popupClassName={`cascader-popup options-${concatenatorOptions.length} concatenator`}
                                disabled={isFirst}
                                allowClear={false}
                                placeholder=''
                                size='small'
                            />
                        </div>
                    </div>
                </div>
                <div className='filter-option'>
                    <span className='filter-option-label'>Filter by</span>
                    <div className='filter-option-value-wrapper'>
                        <div className='filter-option-value'>
                            <Cascader
                                options={filterByOptions}
                                onChange={(value: any) => dispatch({ type: ActionType.filterBy, payload: value[0] })}
                                value={[state.filterBy]}
                                popupClassName={`cascader-popup options-${filterByOptions.length}`}
                                allowClear={false}
                                placeholder=''
                                size='small'
                            />
                        </div>
                    </div>
                </div>
                {state.filterBy && !isBooleanFilterBy() && !isAttributeFilterBy() && (
                    <div className='filter-option'>
                        <span className='filter-option-label'>
                            {filterByOptions.find((option) => option.value === state.filterBy)?.label}
                        </span>
                        <div className='filter-option-value-wrapper'>
                            <div className='filter-option-value operator'>
                                <Cascader
                                    options={getOperatorOptions()}
                                    onChange={(value: any) =>
                                        dispatch({ type: ActionType.operator, payload: value[0] })}
                                    value={[state.operator]}
                                    popupClassName={`cascader-popup options-${getOperatorOptions()?.length} operator`}
                                    allowClear={false}
                                    placeholder=''
                                    size='small'
                                />
                            </div>
                            {!isNumericFilterBy() && (
                                <div className='filter-option-value'>
                                    <Cascader
                                        options={getValueOptions()}
                                        onChange={(value: any) =>
                                            dispatch({ type: ActionType.value, payload: value[0] })}
                                        value={[state.value]}
                                        popupClassName={`cascader-popup options-${getValueOptions()?.length} value`}
                                        allowClear={false}
                                        placeholder=''
                                        size='small'
                                    />
                                </div>
                            )}
                            {isNumericFilterBy() && (
                                <div className='filter-option-value'>
                                    <AutoComplete
                                        className='numeric-autocomplete'
                                        dataSource={getMemorizedFilters()[state.filterBy] ?? []}
                                        filterOption={(inputValue, option) =>
                                            `${option?.props.children}`.indexOf(inputValue) >= 0}
                                        onChange={(value: SelectValue) =>
                                            dispatch({ type: ActionType.value, payload: value })}
                                        placeholder=''
                                        size='small'
                                    />
                                </div>
                            )}
                            {isPixelFilterBy() && <span>px</span>}
                        </div>
                    </div>
                )}
                {state.filterBy && isBooleanFilterBy() && (
                    <div className='filter-option'>
                        <span className='filter-option-label'>
                            {filterByOptions.find((option) => option.value === state.filterBy)?.label}
                        </span>
                        <div className='filter-option-value-wrapper'>
                            <div className='filter-option-value boolean'>
                                <Radio.Group
                                    onChange={(e: RadioChangeEvent) =>
                                        dispatch({ type: ActionType.value, payload: e.target.value })}
                                    value={state.value}
                                >
                                    {filterByBooleanOptions.map((option) => (
                                        <Radio key={option.value.toString()} value={option.value}>
                                            {option.label}
                                        </Radio>
                                    ))}
                                </Radio.Group>
                            </div>
                        </div>
                    </div>
                )}
                {isAttributeFilterBy() && (
                    <div className='filter-option'>
                        <span className='filter-option-label'>List for</span>
                        <div className='filter-option-value-wrapper'>
                            <div className='filter-option-value'>
                                <Cascader
                                    options={getValueOptions()}
                                    onChange={(value: any) => dispatch({ type: ActionType.value, payload: value[0] })}
                                    value={[state.value]}
                                    popupClassName={`cascader-popup options-${
                                        getValueOptions()?.length
                                    } value-label-postfix`}
                                    allowClear={false}
                                    placeholder=''
                                    size='small'
                                />
                            </div>
                            <span>
                                label
                                {state.value === 'all' ? 's' : ''}
                            </span>
                        </div>
                    </div>
                )}
                {isAttributeFilterBy() && state.value && (
                    <div className='filter-option'>
                        <span className='filter-option-label'>Attribute</span>
                        <div className='filter-option-value-wrapper'>
                            <div className='filter-option-value'>
                                <Cascader
                                    options={getAttributeOptions(state.value)}
                                    onChange={(value: any) =>
                                        dispatch({ type: ActionType.attribute, payload: value[0] })}
                                    value={[state.attribute]}
                                    popupClassName={`cascader-popup options-${
                                        getAttributeOptions(state.value)?.length
                                    }`}
                                    allowClear={false}
                                    placeholder=''
                                    size='small'
                                />
                            </div>
                        </div>
                    </div>
                )}
                {isAttributeFilterBy() && state.attribute && (
                    <>
                        <div className='filter-option'>
                            <span className='filter-option-label'>Value</span>
                            <div className='filter-option-value-wrapper'>
                                <div className='filter-option-value operator'>
                                    <Cascader
                                        options={getAttributeOperatorOptions()}
                                        onChange={(value: any) =>
                                            dispatch({ type: ActionType.attributeOperator, payload: value[0] })}
                                        value={[state.attributeOperator]}
                                        popupClassName={`cascader-popup options-${
                                            getAttributeOperatorOptions()?.length
                                        } operator`}
                                        allowClear={false}
                                        placeholder=''
                                        size='small'
                                    />
                                </div>
                                <div className='filter-option-value'>
                                    <Cascader
                                        options={getAttributeValueOptions()}
                                        onChange={(value: any) =>
                                            dispatch({ type: ActionType.attributeValue, payload: value[0] })}
                                        value={[state.attributeValue]}
                                        popupClassName={`cascader-popup options-${
                                            getAttributeValueOptions()?.length
                                        } value`}
                                        allowClear={false}
                                        placeholder=''
                                        size='small'
                                    />
                                </div>
                            </div>
                        </div>
                        {state.attributeValue === 'anotherAttribute' && (
                            <div className='filter-option'>
                                <span className='filter-option-label'>List for</span>
                                <div className='filter-option-value-wrapper'>
                                    <div className='filter-option-value'>
                                        <Cascader
                                            options={getValueOptions()}
                                            onChange={(value: any) =>
                                                dispatch({ type: ActionType.anotherAttributeLabel, payload: value[0] })}
                                            value={[state.anotherAttributeLabel]}
                                            popupClassName={`cascader-popup options-${
                                                getValueOptions()?.length
                                            } value-label-postfix`}
                                            allowClear={false}
                                            placeholder=''
                                            size='small'
                                        />
                                    </div>
                                    <span>
                                        label
                                        {state.anotherAttributeLabel === 'all' ? 's' : ''}
                                    </span>
                                </div>
                            </div>
                        )}
                        {state.anotherAttributeLabel && (
                            <div className='filter-option'>
                                <span className='filter-option-label'>Attribute</span>
                                <div className='filter-option-value-wrapper'>
                                    <div className='filter-option-value'>
                                        <Cascader
                                            options={getAttributeOptions(state.anotherAttributeLabel)}
                                            onChange={(value: any) =>
                                                dispatch({ type: ActionType.anotherAttributeValue, payload: value[0] })}
                                            value={[state.anotherAttributeValue]}
                                            popupClassName={`cascader-popup options-${
                                                getAttributeOptions(state.anotherAttributeLabel)?.length
                                            }`}
                                            allowClear={false}
                                            placeholder=''
                                            size='small'
                                        />
                                    </div>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
            <div className='filter-action-wrapper'>
                {!editItem && (
                    <Button type='primary' onClick={() => onAddNew(state)}>
                        Add
                    </Button>
                )}
                {editItem && <Button type='primary'>Update</Button>}
            </div>
        </Modal>
    );
};

AnnotationFilterPanel.propTypes = {
    isFirst: PropTypes.bool,
    isVisible: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    onAddNew: PropTypes.func.isRequired,
    editItem: PropTypes.objectOf(PropTypes.any),
};

export default AnnotationFilterPanel;
