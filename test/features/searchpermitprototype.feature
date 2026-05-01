@smoke
Feature: Search Permit
 @permit-search
  Scenario: Search for valid permits and verify results
  Given I am on the Search Permit page
    And I enter password "control"
    And click on continue
    And I click on empty search permit 
    And I can see the title "Search for CITES permits"
    When I search using the following permit numbers:
      | Permit number  |
      | 26GBIMPABS719  |
      | 26GBIMPSTYXH1  |
      | 26GBIMPSTYHNO  |
    Then I should see a message showing the number of permits that matched my search
    And the number of displayed permit results should match the count shown in the message
   And the displayed permit results should match the search criteria
    And I should see the following permit results:
      | Permit number  | Type   | Scientific name   | Quantity | Valid until     | Status | Action       |
      | 26GBIMPABS719  | Import | Hirudo verbana    | 10kg     | 24 June 2026    | Valid  | Check permit |
      | 26GBIMPSTYXH1  | Import | Hirudo verbana    | 10kg     | 24 June 2026    | Valid  | Check permit |
      | 26GBIMPSTYHNO  | Import | Hirudo verbana    | 10kg     | 24 June 2026    | Valid  | Check permit |
  
  @errorMessage
  Scenario Outline: Invalid permit inputs show the right message
    Given I am on the Search Permit page
    And I enter password "control"
    And click on continue
    And I click on empty search permit 
    And I can see the title "Search for CITES permits"
    When I search using permit number "<permit number>"
    Then I should see the message "<expected message>"

    Examples:
      | permit number | expected message                |
      | INVALID123    | Permit numbers not found        |
      | 000000        | Permit numbers not found        |
      | TESTPERMIT    | Permit numbers not found        |
      | @@@###        | Permit numbers not found        | 
      |               | Enter at least one permit number|