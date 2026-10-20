import XCTest

@testable import OpenWish

@available(iOS 16.0, macOS 13.0, *)
final class FeedbackLanguageTests: XCTestCase {

    func testRegionsMatchButChineseScriptsDoNot() {
        XCTAssertTrue(FeedbackLanguage.matches(Locale.Language(identifier: "en"), Locale.Language(identifier: "en-GB")))
        XCTAssertFalse(FeedbackLanguage.matches(Locale.Language(identifier: "zh-Hans"), Locale.Language(identifier: "zh-Hant")))
        XCTAssertFalse(FeedbackLanguage.matches(Locale.Language(identifier: "de"), Locale.Language(identifier: "en")))
    }

    func testShortTextIsNeverDetected() {
        XCTAssertNil(FeedbackLanguage.dominantLanguage(of: "Dark Mode"))
        XCTAssertEqual(
            FeedbackLanguage.dominantLanguage(of: "Bitte fügt einen dunklen Modus für die Nacht hinzu")?.languageCode,
            Locale.Language(identifier: "de").languageCode
        )
    }
}
