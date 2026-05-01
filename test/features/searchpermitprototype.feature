@smoke
Feature: Search Permit

  Background:
    Given I am on the Search Permit page
    And I enter password "control"
    And click on continue
    And I click on empty search permit
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



    #Scenario: Check permit details
    #When I search using the following permit numbers:
    #  | Permit number  |
    #  | 26GBIMPABS719  |
    #And I click on check permit
    #And I should be navigated to check permit details page
    #And I should see below details:
    #| Section                | Field                         | Value |
    #| Permit overview        | Permit number                 | 26GBIMPABS719 |
    #| Permit overview        | Type                          | Import |
    #| Permit overview        | Valid until                   | 24 June 2026 |
    #| Permit overview        | Status                        | Valid |
    #| Exporter/re-exporter   | Name                          | Anatolia Medicinal Leeches Export |
    #| Exporter/re-exporter   | Address                       | Su Urunleri Mah., Balikci Sokak, No: 12 55000, Carsamba Samsun, Turkey |
    #| Exporter/re-exporter   | Country of re-export          | Turkey |
    #| Importer               | Name                          | Medileech Supplies UK Ltd |
    #| Importer               | Address                       | 14 Riverside Business Park, Mill Lane, Bristol, BS2 0XT, United Kingdom |
    #| Importer               | Country of import             | United Kingdom |
    #| Specimen details       | Scientific name of species    | Hirudo verbana |
    #| Specimen details       | Common name of species        | Southern medicinal leech |
    #| Specimen details       | Description of specimens      | Ten kilograms of live leeches |
    #| Specimen details       | Code                          | LIV |
    #| Specimen details       | CITES Appendix                | II |
    #| Specimen details       | GB Annex                      | B |
    #| Specimen details       | Source                        | W: Wild |
    #| Specimen details       | Purpose                       | T: Commercial trade |
    #| Specimen details       | Net mass                      | 10kg |
    #| Origin history         | Country of origin             | Turkey |
    #| Origin history         | Date of issue                 | 20 March 2026 |
    #| Origin history         | Permit number                 | TR120126/ANK/00079 |
    #| Remarks and conditions | Special conditions            | This permit is valid only for the specimens and quantities stated. Transport of live animals must follow the current edition of the IATA Live Animals Regulations. A copy of this permit must travel with the consignment. Endorsement by Border Force confirms import clearance against the customs declaration you enter in this service. |
    #| Authority details      | Management authority          | Animal and Plant Health Agency (APHA) |
    #| Authority details      | Signature                     | Emma Biggs, Head of International Trade and Customer Service |
    #| Authority details      | Issuing official              | J. Smith |
    #| Authority details      | Place and date of issue       | Bristol, 19 January 2026 |
    #Then I Should see "Enter endorsement details"
    #And I enter Net mass, in kilograms
    #And I enter Customs document reference
    #And I click on "Endorse Permit"
