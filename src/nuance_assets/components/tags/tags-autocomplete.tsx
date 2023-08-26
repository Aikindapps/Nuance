// original source: https://github.com/peterKaleta/react-token-autocomplete

import React, { useState, useEffect, useRef, useCallback } from 'react';
import OptionList from './options';
import Token from './token';
import { includes, difference, result } from 'lodash';
import keyCodes from './key-codes';
import { arraysEqual } from '../../shared/utils';
import { icons, colors } from '../../shared/constants';

type TagsAutocompleteProps = {
  options: string[];
  value: string[];
  placeholder: string;
  maxAllowedTags: number;
  processing?: boolean;
  onValidationError?: (errorMessage: string) => void | undefined;
  onChange?: (values: string[]) => void | undefined;
  hasError: Boolean;
  dark?: boolean;
};

const TagsAutocomplete: React.FC<TagsAutocompleteProps> = ({
  options = [],
  value = [],
  placeholder = 'add new tag',
  maxAllowedTags = -1, //no max
  processing = false,
  onValidationError = undefined,
  onChange = undefined,
  hasError = 'false',
  dark = false,
}) => {
  const refWrapper = useRef<HTMLDivElement>(null);
  const refInput = useRef<HTMLInputElement>(null);

  const [focused, setFocused] = useState(false);

  const [selected, _setSelected] = useState<number>(0);
  const selectedRef = useRef(selected);
  const setSelected = (data: number) => {
    selectedRef.current = data;
    _setSelected(data || 0);
  };

  // use inputValueRef.current instead of inputValue
  // so it can be accessed from event listeners
  const [inputValue, _setInputValue] = useState('');
  const inputValueRef = useRef(inputValue);
  const setInputValue = (data: string) => {
    inputValueRef.current = data;
    _setInputValue(data || '');
  };

  // use valuesRef.current instead of values
  // so it can be accessed from event listeners
  const [values, _setValues] = useState<string[]>([]);
  const valuesRef = useRef(values);
  const setValues = (data: string[]) => {
    valuesRef.current = data;
    _setValues(data);
  };

  useEffect(() => {
    setValues([]);

    window?.addEventListener('click', handleClick);

    return () => {
      window?.removeEventListener('click', handleClick);
    };
  }, []);

  useEffect(() => {
    if (!arraysEqual(value, values)) {
      setValues(value);
    }
  }, [value]);

  useEffect(() => {
    if (focused) {
      refInput.current?.focus();
      window?.addEventListener('keydown', onKeyDown);
    } else {
      refInput.current?.blur();
      window?.removeEventListener('keydown', onKeyDown);
    }
  }, [focused]);

  useEffect(() => {
    onChange && onChange(valuesRef.current);
  }, [values]);

  //EVENT HANDLERS

  // memoized event handler for one instance to add remove listener
  const onKeyDown = useCallback((e: any) => {
    switch (e.keyCode) {
      case keyCodes.ESC:
        setFocused(false);
        break;
      case keyCodes.ENTER:
        handleOptionClicked(selectedRef.current);
        refInput.current?.focus();
        e.preventDefault();
        break;
      case keyCodes.TAB:
        setFocused(false);
        break;
      case keyCodes.BACKSPACE:
        if (inputValueRef.current.length) {
          setInputValue(inputValueRef.current.slice(0, -1));
        } else {
          deleteValue(valuesRef.current.length - 1);
        }
        e.preventDefault();
        break;
      case keyCodes.UP:
        selectPrev(selectedRef.current);
        e.preventDefault();
        break;
      case keyCodes.DOWN:
        selectNext(selectedRef.current);
        e.preventDefault();
        break;
    }
  }, []);

  const handleClick = useCallback((e: any) => {
    const clickedOutside =
      refWrapper.current && !refWrapper.current.contains(e.target);

    if (clickedOutside) {
      setFocused(false);
    } else {
      setFocused(true);
    }
  }, []);

  const onInputChange = (e: any) => {
    if (e.target.value !== inputValueRef.current) {
      setInputValue(e.target.value);

      if (selectedRef.current > getAvailableOptions().length - 1) {
        setSelected(0);
      }
    }
  };

  const handleOptionSelected = (index: number) => {
    setSelected(index);
  };

  const handleOptionClicked = (index: number) => {
    if (isOverMaxTags()) {
      onValidationError &&
        onValidationError(`A maximum of ${maxAllowedTags} tags can be added.`);

      return;
    }

    const availableOptions = getAvailableOptions();
    const newValue = availableOptions[index];
    const isAlreadyAdded = includes(valuesRef.current, newValue);
    const shouldAddValue = !!newValue && !isAlreadyAdded;

    if (shouldAddValue) {
      let newValues = [...valuesRef.current, newValue];

      setValues(newValues);
      setInputValue('');

      const availableOptions = getAvailableOptions();
      if (index > availableOptions.length - 1) {
        setSelected(availableOptions.length - 1);
      }
    }

    setFocused(true);
  };

  const selectNext = (index: number) => {
    const availableOptions = getAvailableOptions();
    let next = index + 1;
    if (next > availableOptions.length - 1) {
      next = 0;
    }

    setSelected(next);
  };

  const selectPrev = (index: number) => {
    const availableOptions = getAvailableOptions();
    let prev = index - 1;
    if (prev < 0) {
      prev = availableOptions.length - 1;
    }

    setSelected(prev);
  };

  //ACTIONS

  const deleteValue = (index: number) => {
    const removed = valuesRef.current.slice(index)[0];
    const newValues = valuesRef.current.filter((_, i) => i !== index);

    setValues(newValues);

    setFocused(true);
  };

  //HELPERS

  const getAvailableOptions = () => {
    let results = difference(options, valuesRef.current);

    if (inputValueRef.current.length) {
      results = results.filter((v) =>
        v.toLowerCase().includes(inputValueRef.current.toLowerCase())
      );
    }

    return results;
  };

  const shouldShowOptions = () => {
    return focused;
  };

  const isOverMaxTags = (): Boolean => {
    return maxAllowedTags > -1 && valuesRef.current.length + 1 > maxAllowedTags;
  };

  //RENDERERS

  const renderOptionsDropdown = () => {
    if (shouldShowOptions()) {
      let passProps = {
        options: getAvailableOptions(),
        selected,
        handleOptionSelected,
        handleOptionClicked,
      };
      return <OptionList {...passProps} />;
    } else {
      return null;
    }
  };

  const renderTokens = () => {
    return valuesRef.current.map((value, key) => {
      return (
        <Token key={key} index={key} value={value} handleRemove={deleteValue} />
      );
    });
  };

  const renderProcessing = () => {
    return processing ? <div className='processing' /> : null;
  };

  const className = Boolean(hasError) ? 'has-error' : 'input';

  const darkOptionsAndColors = {
    background: dark ? colors.primaryTextColor : colors.primaryBackgroundColor,
    color: dark ? colors.primaryBackgroundColor : colors.primaryTextColor,
  };

  const renderInput = () => {
    return (
      <input
        style={{ background: darkOptionsAndColors.background }}
        className={className}
        ref={refInput}
        onChange={onInputChange}
        value={inputValueRef.current || ''}
        placeholder={placeholder}
      />
    );
  };
  return (
    <div ref={refWrapper} className='tags'>
      <div className='input-wrapper'>
        <img
          className='tag-icon'
          src={icons.TAG}
          style={{ filter: dark ? 'contrast(0.1)' : 'none' }}
        />
        {renderTokens()}
        {!isOverMaxTags() && renderInput()}
        {renderProcessing()}
      </div>
      {renderOptionsDropdown()}
    </div>
  );
};

export default TagsAutocomplete;
