#import <Foundation/Foundation.h>
#import <React/RCTBridgeModule.h>

@interface BackgroundMushafDownloads : NSObject <RCTBridgeModule, NSURLSessionDownloadDelegate, NSXMLParserDelegate>
+ (void)handleEvents:(NSString *)identifier completion:(void (^)(void))completion;
@end
