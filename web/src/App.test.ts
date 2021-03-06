import {render} from '@testing-library/svelte';
import {expect} from 'chai';
import App from './App.svelte';

describe('<App>', () => {
  it('renders "npx degit wighawag/mandalas your-app-folder"', () => {
    const {getByText} = render(App);
    const linkElement = getByText(
      /npx degit wighawag\/mandalas your-app-folder/i
    );
    expect(document.body.contains(linkElement));
  });
});
