@accessibility @ui
Feature: Accessibility

  Background:
    Given I am on the Search Permit page
    And I can see the title "Search for CITES permits"

  Scenario: Search Permit page has no accessibility violations
    Then the page should have no accessibility violations

  Scenario: Search Permit results page has no accessibility violations
    When I search using the following permit numbers:
      | Permit number       |
      | 24GBEXPBE0GWD       |
    Then the page should have no accessibility violations

  Scenario: Check Permit Details page has no accessibility violations
    When I search using the following permit numbers:
      | Permit number       |
      | 24GBEXPBE0GWD       |
    And I select "Check permit" for permit number "24GBEXPBE0GWD"
    Then the page should have no accessibility violations
