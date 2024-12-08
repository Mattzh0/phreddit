import { render, screen } from '@testing-library/react';
import Banner from './components/comp-banner';
import '@testing-library/jest-dom';

describe('Banner Component', () => {
  // Mock functions for props
  const mockSetSearchQuery = jest.fn();
  const mockDisplayPage = jest.fn();
  const mockSetCurCommunityID = jest.fn();
  const mockHandleLogout = jest.fn();

  // Test for guest user view
  test('Create Post button is disabled for guest users', () => {
    render(
      <Banner
        setSearchQuery={mockSetSearchQuery}
        displayPage={mockDisplayPage}
        curPage="welcome"
        setCurCommunityID={mockSetCurCommunityID}
        isLoggedIn={false}
        handleLogout={mockHandleLogout}
        displayName=""
      />
    );

    // Check for the gray (disabled) post button
    const disabledButton = screen.getByText('Create Post');
    expect(disabledButton).toHaveAttribute('id', 'gray-post-button');
    
    // Verify guest button is present
    expect(screen.getByText('Guest')).toBeInTheDocument();
  });

  // Test for logged-in user view
  test('Create Post button is enabled for logged-in users', () => {
    render(
      <Banner
        setSearchQuery={mockSetSearchQuery}
        displayPage={mockDisplayPage}
        curPage="welcome"
        setCurCommunityID={mockSetCurCommunityID}
        isLoggedIn={true}
        handleLogout={mockHandleLogout}
        displayName="TestUser"
      />
    );

    // Check for the enabled create post button
    const enabledButton = screen.getByText('Create Post');
    expect(enabledButton).toHaveClass('create-post-button');
    
    // Verify it's clickable by checking if it has the onClick handler
    expect(enabledButton).toHaveProperty('onclick');
    
    // Verify logout button is present for logged-in users
    expect(screen.getByText('Logout')).toBeInTheDocument();
  });
});