@accessibility @ui
Feature: Accessibility

  Background:
    Given I am on the Search Permit page
    And I can see the title "Search for CITES permits"

  Scenario: Search Permit page has no accessibility violations
    Then the page should have no accessibility violations
