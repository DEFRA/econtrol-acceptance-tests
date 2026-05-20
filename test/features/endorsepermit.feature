@endorsepermit @cts-110
Feature: Search, validate and endorse CITES permits

  Background:
    Given I am logged in as an authorised Border Force officer
    And I can see the title "Search for CITES permits"

  Scenario: Search for valid permits and endorse a permit successfully

    When I search using the following permit numbers:
      | Permit number |
      | 26GBIMPABS719 |

    Then I should see a message showing the number of permits that matched my search
    And the number of displayed permit results should match the count shown in the message
    And the displayed permit results should match the search criteria

    And I should see the following permit results for valid:
      | Permit number | Type   | Scientific name   | Quantity | Valid until     | Status | Action       |
      | 26GBIMPABS719 | Import | Python bivittatus | 1        | 30 October 2026 | Valid  | Check permit |
