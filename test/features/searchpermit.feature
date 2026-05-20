@smoke
Feature: Search Permit

  Background:
    Given I am logged in as an authorised Border Force officer
    And I can see the title "Search for CITES permits"

  @permit-search
  Scenario: Search for valid permits and verify results
    When I search using the following permit numbers:
      | Permit number |
      | 26GBIMPABS719 |
      | 26GBIMPSTYXH1 |
      | 26GBIMPSTYHNO |
    Then I should see a message showing the number of permits that matched my search
    And the number of displayed permit results should match the count shown in the message
    And the displayed permit results should match the search criteria
    And I should see the following permit results for valid:
      | Permit number | Type   | Scientific name | Quantity | Valid until  | Status | Action       |
      | 26GBIMPABS719 | Import | Hirudo verbana  |     10kg | 24 June 2026 | Valid  | Check permit |
      | 26GBIMPSTYXH1 | Import | Hirudo verbana  |     10kg | 24 June 2026 | Valid  | Check permit |
      | 26GBIMPSTYHNO | Import | Hirudo verbana  |     10kg | 24 June 2026 | Valid  | Check permit |

  @errorMessage @cts-589
  Scenario Outline: Invalid permit inputs show the right message
    When I search using permit number "<permit number>"
    Then I should see the message "<expected message>" for invalid

    Examples:
      | permit number | expected message                 |
      | INVALID123    | Permit numbers not found         |
      |        000000 | Permit numbers not found         |
      | TESTPERMIT    | Permit numbers not found         |
      | @@@###        | Permit numbers not found         |
      |               | Enter at least one permit number |

  @cts-589
  Scenario: User navigates back to Search page from results or details
    When I search using the following permit numbers:
      | Permit number |
      | 26GBI         |
    When I click on Change Search
    Then I can see the title "Search for CITES permits"
    And the search input field should be visible

  @CTS-585
  Scenario: Search for valid and invalid permits and verify results
    When I search using the following permit numbers:
      | Permit number |
      | 26GBIMPABS719 |
      | 26GBIMPSTYXH1 |
      | 26.           |
    Then I should see the message "Permit numbers not found" for invalid
    And I should see the following permit results for valid:
      | Permit number | Type   | Scientific name | Quantity | Valid until  | Status | Action       |
      | 26GBIMPABS719 | Import | Hirudo verbana  |     10kg | 24 June 2026 | Valid  | Check permit |
      | 26GBIMPSTYXH1 | Import | Hirudo verbana  |     10kg | 24 June 2026 | Valid  | Check permit |
    When I click on Change Search
    Then I can see the title "Search for CITES permits"
    And the search input field should be visible