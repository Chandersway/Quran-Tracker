#import "BackgroundMushafDownloads.h"
#import <UIKit/UIKit.h>
#import <zlib.h>
#include <stdio.h>

static NSString *const SessionID = @"com.Ameender.qurantracker.mushaf-background.v1";

@interface MushafSVGValidator : NSObject <NSXMLParserDelegate>
@property BOOL root;
@property BOOL invalid;
@end
@implementation MushafSVGValidator
- (void)parser:(NSXMLParser *)parser didStartElement:(NSString *)element namespaceURI:(NSString *)uri qualifiedName:(NSString *)name attributes:(NSDictionary *)attributes {
  if (!self.root) { self.root = YES; if (![element isEqualToString:@"svg"]) { self.invalid = YES; [parser abortParsing]; } }
}
@end

@interface BackgroundMushafDownloads ()
@property (nonatomic, strong) NSURLSession *session;
@property (nonatomic, strong) dispatch_queue_t queue;
@property (nonatomic, strong) NSMutableDictionary *job;
@property (nonatomic, strong) NSDictionary *catalog;
@property (nonatomic, strong) NSURL *stateURL;
@property (nonatomic, copy) void (^completion)(void);
@property BOOL recovering;
@property (nonatomic, strong) NSMutableArray *recoveryCallbacks;
+ (instancetype)engine;
+ (instancetype)engineWithCompletion:(void (^)(void))completion;
- (instancetype)initEngineWithCompletion:(void (^)(void))completion;
- (void)recover:(void (^)(NSDictionary *))finished;
@end

@implementation BackgroundMushafDownloads
RCT_EXPORT_MODULE(BackgroundMushafDownloads)
+ (BOOL)requiresMainQueueSetup { return NO; }
+ (instancetype)engine { return [self engineWithCompletion:nil]; }
+ (instancetype)engineWithCompletion:(void (^)(void))completion {
  static BackgroundMushafDownloads *engine; static dispatch_once_t once; __block BOOL created = NO;
  dispatch_once(&once, ^{ created = YES; engine = [[self alloc] initEngineWithCompletion:completion]; });
  if (completion && !created) dispatch_sync(engine.queue, ^{ engine.completion = completion; });
  return engine;
}
// React creates a facade; one retained engine owns URLSession and durable state.
- (instancetype)init { return [super init]; }
- (instancetype)initEngineWithCompletion:(void (^)(void))completion {
  if ((self = [super init])) {
    _completion = [completion copy];
    _recoveryCallbacks = [NSMutableArray array];
    _queue = dispatch_queue_create("com.Ameender.qurantracker.mushaf-downloads", DISPATCH_QUEUE_SERIAL);
    NSURL *catalogURL = [NSBundle.mainBundle URLForResource:@"mushaf_download_catalog" withExtension:@"json"];
    NSData *catalogData = [NSData dataWithContentsOfURL:catalogURL];
    _catalog = catalogData ? [NSJSONSerialization JSONObjectWithData:catalogData options:0 error:nil] : @{};
    NSURL *support = [[NSFileManager.defaultManager URLsForDirectory:NSApplicationSupportDirectory inDomains:NSUserDomainMask] firstObject];
    [NSFileManager.defaultManager createDirectoryAtURL:support withIntermediateDirectories:YES attributes:@{NSFileProtectionKey: NSFileProtectionCompleteUntilFirstUserAuthentication} error:nil];
    _stateURL = [support URLByAppendingPathComponent:@"mushaf-background-v1.json"];
    NSData *data = [NSData dataWithContentsOfURL:_stateURL];
    if (data) _job = [NSJSONSerialization JSONObjectWithData:data options:NSJSONReadingMutableContainers error:nil];
    if (_job && (![[NSUUID alloc] initWithUUIDString:_job[@"id"]] || !_catalog[_job[@"edition"]])) _job = nil;
    NSURLSessionConfiguration *config = [NSURLSessionConfiguration backgroundSessionConfigurationWithIdentifier:SessionID];
    config.sessionSendsLaunchEvents = YES; config.discretionary = NO; config.waitsForConnectivity = YES;
    config.allowsCellularAccess = YES; config.HTTPMaximumConnectionsPerHost = 4;
    config.timeoutIntervalForResource = 7 * 24 * 60 * 60;
    NSOperationQueue *delegate = [NSOperationQueue new]; delegate.maxConcurrentOperationCount = 1;
    _session = [NSURLSession sessionWithConfiguration:config delegate:self delegateQueue:delegate];
    [self recover:nil];
  }
  return self;
}
+ (void)handleEvents:(NSString *)identifier completion:(void (^)(void))completion {
  if (![identifier isEqualToString:SessionID]) { completion(); return; }
  // Install this batch's handler before creating a session that may deliver queued events.
  // UIKit calls AppDelegate before dispatching completion events to an existing session.
  [self engineWithCompletion:completion];
}
- (BOOL)active { return [@[@"checking", @"downloading"] containsObject:self.job[@"status"]]; }
- (NSURL *)root {
  NSURL *documents = [[NSFileManager.defaultManager URLsForDirectory:NSDocumentDirectory inDomains:NSUserDomainMask] firstObject];
  return [documents URLByAppendingPathComponent:@"downloaded_mushafs" isDirectory:YES];
}
- (NSURL *)marker { return [[self root] URLByAppendingPathComponent:[@".ignore-" stringByAppendingString:self.job[@"edition"]]]; }
- (NSURL *)target:(NSInteger)page {
  NSString *edition = self.job[@"edition"]; NSDictionary *option = self.catalog[edition];
  if (!option || page < 1 || page > [option[@"pages"] integerValue]) @throw [NSException exceptionWithName:@"MushafEdition" reason:@"Invalid edition/page" userInfo:nil];
  NSString *name = [option[@"type"] isEqual:@"pdf"] ? @"mushaf.pdf" : [NSString stringWithFormat:@"%03ld.%@", (long)page, option[@"type"]];
  NSURL *directory = [[self root] URLByAppendingPathComponent:edition isDirectory:YES];
  return [directory URLByAppendingPathComponent:name];
}
- (NSURL *)source:(NSInteger)page {
  NSDictionary *option = self.catalog[self.job[@"edition"]];
  NSString *source = [option[@"type"] isEqual:@"pdf"] ? option[@"url"] : [NSString stringWithFormat:@"%@/%ld.%@", option[@"url"], (long)page, option[@"type"]];
  NSURL *url = [NSURL URLWithString:source];
  if (![url.scheme isEqual:@"https"] || url.user || url.password || url.port || url.query || url.fragment) @throw [NSException exceptionWithName:@"MushafSource" reason:@"Invalid source" userInfo:nil]; return url;
}
- (void)save {
  NSData *data = [NSJSONSerialization dataWithJSONObject:self.job options:0 error:nil];
  NSError *error;
  if (!data || ![data writeToURL:self.stateURL options:NSDataWritingAtomic | NSDataWritingFileProtectionCompleteUntilFirstUserAuthentication error:&error])
    @throw [NSException exceptionWithName:@"MushafState" reason:@"Could not persist download state" userInfo:nil];
  [self.stateURL setResourceValue:@YES forKey:NSURLIsExcludedFromBackupKey error:nil];
}
- (BOOL)valid:(NSURL *)url type:(NSString *)type {
  @try {
    NSNumber *size; [url getResourceValue:&size forKey:NSURLFileSizeKey error:nil];
    NSUInteger maximum = [type isEqual:@"pdf"] ? 512 * 1024 * 1024 : 10 * 1024 * 1024;
    if (!size || size.unsignedLongLongValue == 0 || size.unsignedLongLongValue > maximum) return NO;
    NSFileHandle *handle = [NSFileHandle fileHandleForReadingAtPath:url.path];
    if (!handle) return NO;
    NSData *head = [handle readDataOfLength:4096]; [handle seekToFileOffset:MAX(0LL, size.longLongValue - 4096)];
    NSData *tail = [handle readDataToEndOfFile]; [handle closeFile];
    if ([type isEqual:@"pdf"]) return head.length >= 4 && memcmp(head.bytes, "%PDF", 4) == 0 && [[[NSString alloc] initWithData:tail encoding:NSISOLatin1StringEncoding] containsString:@"%%EOF"];
    if ([type isEqual:@"png"]) {
      const unsigned char png[] = {137, 80, 78, 71, 13, 10, 26, 10};
      const unsigned char end[] = {0, 0, 0, 0, 73, 69, 78, 68};
      return head.length >= 8 && tail.length >= 12 && memcmp(head.bytes, png, 8) == 0 && memcmp((const char *)tail.bytes + tail.length - 12, end, 8) == 0;
    }
    NSData *bytes = [NSData dataWithContentsOfURL:url options:NSDataReadingMappedIfSafe error:nil];
    const unsigned char *signature = bytes.bytes;
    if (bytes.length >= 2 && signature[0] == 0x1f && signature[1] == 0x8b) {
      z_stream stream = {0}; stream.next_in = (Bytef *)bytes.bytes; stream.avail_in = (uInt)bytes.length;
      if (inflateInit2(&stream, 15 + 32) != Z_OK) return NO;
      NSMutableData *output = [NSMutableData data]; unsigned char buffer[32768]; int result;
      do { stream.next_out = buffer; stream.avail_out = sizeof(buffer); result = inflate(&stream, Z_NO_FLUSH);
        [output appendBytes:buffer length:sizeof(buffer) - stream.avail_out];
        if (output.length > 16 * 1024 * 1024) { inflateEnd(&stream); return NO; }
      } while (result == Z_OK);
      BOOL complete = result == Z_STREAM_END && stream.avail_in == 0; inflateEnd(&stream); if (!complete) return NO; bytes = output;
    }
    MushafSVGValidator *validator = [MushafSVGValidator new]; NSXMLParser *parser = [[NSXMLParser alloc] initWithData:bytes];
    parser.shouldResolveExternalEntities = NO; parser.shouldProcessNamespaces = YES; parser.delegate = validator;
    return [parser parse] && validator.root && !validator.invalid;
  } @catch (NSException *exception) { return NO; }
}
- (void)terminal:(NSString *)status error:(NSString *)error {
  self.job[@"status"] = status; if (error) self.job[@"error"] = error; [self save];
  NSString *prefix = [self.job[@"id"] stringByAppendingString:@":"];
  [self.session getAllTasksWithCompletionHandler:^(NSArray<__kindof NSURLSessionTask *> *tasks) {
    for (NSURLSessionTask *task in tasks) if ([task.taskDescription hasPrefix:prefix]) [task cancel];
  }];
}
- (NSDictionary *)snapshot {
  if (!self.job) return nil;
  NSDictionary *option = self.catalog[self.job[@"edition"]]; BOOL pdf = [option[@"type"] isEqual:@"pdf"];
  NSInteger count = 0; BOOL waiting = NO;
  for (NSDictionary *item in self.job[@"items"]) { if ([item[@"done"] boolValue]) count++; if ([item[@"waiting"] boolValue] && ![item[@"done"] boolValue]) waiting = YES; }
  NSDictionary *first = [self.job[@"items"] firstObject];
  return @{ @"id": self.job[@"id"], @"edition": self.job[@"edition"], @"status": self.job[@"status"],
    @"unit": pdf ? @"bytes" : @"pages", @"completed": pdf ? (first[@"bytes"] ?: @0) : @(count),
    @"total": pdf ? ([first[@"total"] longLongValue] > 0 ? first[@"total"] : NSNull.null) : option[@"pages"],
    @"waiting": @(waiting), @"error": self.job[@"error"] ?: @"" };
}
- (void)enqueue:(NSInteger)page {
  NSMutableURLRequest *request = [NSMutableURLRequest requestWithURL:[self source:page]];
  [request setValue:@"Mozilla/5.0 (compatible; Wirdna/1.0)" forHTTPHeaderField:@"User-Agent"];
  NSURLSessionDownloadTask *task = [self.session downloadTaskWithRequest:request];
  task.taskDescription = [NSString stringWithFormat:@"%@:%ld", self.job[@"id"], (long)page];
  self.job[@"items"][page - 1][@"taskID"] = @(task.taskIdentifier); [task resume];
}
- (void)recover:(void (^)(NSDictionary *))finished {
  dispatch_async(self.queue, ^{
    if (finished) [self.recoveryCallbacks addObject:[finished copy]];
    if (self.recovering) return;
    self.recovering = YES;
    NSString *expectedID = self.job[@"id"];
    [self.session getAllTasksWithCompletionHandler:^(NSArray<__kindof NSURLSessionTask *> *tasks) {
    dispatch_async(self.queue, ^{
      if ((expectedID || self.job[@"id"]) && ![expectedID isEqual:self.job[@"id"]]) {
        self.recovering = NO; [self recover:nil]; return;
      }
      @try {
      if ([self active]) {
        if ([NSFileManager.defaultManager fileExistsAtPath:[self marker].path]) { [self terminal:@"cancelled" error:nil]; }
        else {
          NSMutableSet *scheduled = [NSMutableSet set]; NSString *prefix = [self.job[@"id"] stringByAppendingString:@":"];
          NSArray *ordered = [tasks sortedArrayUsingComparator:^NSComparisonResult(NSURLSessionTask *a, NSURLSessionTask *b) { return a.taskIdentifier > b.taskIdentifier ? NSOrderedAscending : NSOrderedDescending; }];
          for (NSURLSessionTask *task in ordered) {
            if (![task.taskDescription hasPrefix:prefix]) { [task cancel]; continue; }
            NSInteger page = [[task.taskDescription substringFromIndex:prefix.length] integerValue];
            if (page < 1 || page > [self.job[@"items"] count]) { [task cancel]; continue; }
            NSMutableDictionary *item = self.job[@"items"][page - 1];
            if ([item[@"done"] boolValue] || [scheduled containsObject:@(page)]) { [task cancel]; continue; }
            item[@"taskID"] = @(task.taskIdentifier);
            [scheduled addObject:@(page)]; item[@"bytes"] = @(MAX(0LL, task.countOfBytesReceived)); item[@"total"] = @(task.countOfBytesExpectedToReceive);
            item[@"waiting"] = @(task.state == NSURLSessionTaskStateSuspended);
            if (task.state == NSURLSessionTaskStateSuspended) [task resume];
          }
          BOOL complete = YES;
          for (NSInteger page = 1; page <= [self.job[@"items"] count]; page++) {
            NSMutableDictionary *item = self.job[@"items"][page - 1];
            if (![item[@"done"] boolValue] && [self valid:[self target:page] type:self.catalog[self.job[@"edition"]][@"type"]]) item[@"done"] = @YES;
            if ([item[@"done"] boolValue]) continue;
            complete = NO; if (![scheduled containsObject:@(page)]) [self enqueue:page];
          }
          if (complete) [self terminal:@"completed" error:nil];
          else { self.job[@"status"] = @"downloading"; [self save]; }
        }
      }
      } @catch (NSException *exception) {
        if (self.job) { self.job[@"status"] = @"failed"; self.job[@"error"] = @"Could not restore download state"; @try { [self save]; } @catch (NSException *ignored) {} }
      }
      self.recovering = NO;
      NSArray *callbacks = [self.recoveryCallbacks copy]; [self.recoveryCallbacks removeAllObjects];
      for (void (^callback)(NSDictionary *) in callbacks) callback([self snapshot]);
    });
  }];
  });
}
RCT_REMAP_METHOD(inspect, inspectWithResolver:(RCTPromiseResolveBlock)resolve rejecter:(RCTPromiseRejectBlock)reject) {
  BackgroundMushafDownloads *engine = [BackgroundMushafDownloads engine];
  [engine recover:^(NSDictionary *state) { resolve(state ?: NSNull.null); }];
}
RCT_REMAP_METHOD(start, startEdition:(NSString *)edition resolver:(RCTPromiseResolveBlock)resolve rejecter:(RCTPromiseRejectBlock)reject) {
  BackgroundMushafDownloads *engine = [BackgroundMushafDownloads engine];
  dispatch_async(engine.queue, ^{
    @try {
      NSDictionary *option = engine.catalog[edition]; if (!option) { reject(@"MUSHAF_EDITION", @"Unknown Mushaf edition", nil); return; }
      if ([engine active]) { resolve([engine snapshot]); return; }
      NSMutableArray *items = [NSMutableArray array]; for (NSInteger page = 0; page < [option[@"pages"] integerValue]; page++) [items addObject:[@{@"done": @NO, @"retries": @0} mutableCopy]];
      engine.job = [@{@"id": NSUUID.UUID.UUIDString, @"edition": edition, @"status": @"checking", @"items": items} mutableCopy];
      [NSFileManager.defaultManager removeItemAtURL:[engine marker] error:nil]; [engine save];
      [engine recover:^(NSDictionary *state) { resolve(state); }];
    } @catch (NSException *exception) { reject(@"MUSHAF_DOWNLOAD", exception.reason, nil); }
  });
}
RCT_REMAP_METHOD(cancel, cancelTask:(NSString *)taskID resolver:(RCTPromiseResolveBlock)resolve rejecter:(RCTPromiseRejectBlock)reject) {
  BackgroundMushafDownloads *engine = [BackgroundMushafDownloads engine];
  dispatch_async(engine.queue, ^{ if ([engine.job[@"id"] isEqual:taskID] && [engine active]) [engine terminal:@"cancelled" error:nil]; resolve([engine snapshot] ?: NSNull.null); });
}
- (NSInteger)pageFor:(NSURLSessionTask *)task {
  if (![self active]) return 0;
  NSString *prefix = [self.job[@"id"] stringByAppendingString:@":"];
  if (![task.taskDescription hasPrefix:prefix]) return 0;
  NSInteger page = [[task.taskDescription substringFromIndex:prefix.length] integerValue];
  if (page < 1 || page > [self.job[@"items"] count]) return 0;
  NSNumber *expected = self.job[@"items"][page - 1][@"taskID"];
  return !expected || expected.unsignedIntegerValue == task.taskIdentifier ? page : 0;
}
- (void)URLSession:(NSURLSession *)session downloadTask:(NSURLSessionDownloadTask *)task didWriteData:(int64_t)bytes totalBytesWritten:(int64_t)done totalBytesExpectedToWrite:(int64_t)total {
  dispatch_async(self.queue, ^{ NSInteger page = [self pageFor:task]; if (!page) return; NSMutableDictionary *item = self.job[@"items"][page - 1]; item[@"bytes"] = @(done); item[@"total"] = @(total); item[@"waiting"] = @NO; });
}
- (void)URLSession:(NSURLSession *)session downloadTask:(NSURLSessionDownloadTask *)task didFinishDownloadingToURL:(NSURL *)location {
  // The temporary URL is valid only during this callback: install synchronously on the native queue.
  dispatch_sync(self.queue, ^{
    @try {
    NSInteger page = [self pageFor:task]; if (!page) return;
    NSMutableDictionary *item = self.job[@"items"][page - 1]; NSString *type = self.catalog[self.job[@"edition"]][@"type"];
    NSHTTPURLResponse *response = (NSHTTPURLResponse *)task.response;
    BOOL sourceOK = [task.originalRequest.URL.absoluteString isEqual:[self source:page].absoluteString] && [response.URL.scheme isEqual:@"https"];
    if (!sourceOK || response.statusCode < 200 || response.statusCode >= 300 || ![self valid:location type:type]) { item[@"invalid"] = @YES; return; }
    NSURL *target = [self target:page], *directory = [target URLByDeletingLastPathComponent];
    [NSFileManager.defaultManager createDirectoryAtURL:directory withIntermediateDirectories:YES attributes:@{NSFileProtectionKey: NSFileProtectionCompleteUntilFirstUserAuthentication} error:nil];
    NSURL *temporary = [directory URLByAppendingPathComponent:[NSString stringWithFormat:@".%@-%ld.install", self.job[@"id"], (long)page]];
    [NSFileManager.defaultManager removeItemAtURL:temporary error:nil];
    NSError *error;
    if (![NSFileManager.defaultManager copyItemAtURL:location toURL:temporary error:&error]) { item[@"invalid"] = @YES; return; }
    NSFileHandle *handle = [NSFileHandle fileHandleForWritingAtPath:temporary.path]; [handle synchronizeFile]; [handle closeFile];
    BOOL cancelled = [NSFileManager.defaultManager fileExistsAtPath:[self marker].path];
    if (!cancelled && rename(temporary.fileSystemRepresentation, target.fileSystemRepresentation) == 0) { item[@"done"] = @YES; item[@"invalid"] = @NO; [target setResourceValue:@YES forKey:NSURLIsExcludedFromBackupKey error:nil]; }
    else item[@"invalid"] = @YES;
    [NSFileManager.defaultManager removeItemAtURL:temporary error:nil]; [self save];
    if (cancelled) [self terminal:@"cancelled" error:nil];
    } @catch (NSException *exception) { if ([self active]) { self.job[@"status"] = @"failed"; self.job[@"error"] = @"Could not install downloaded file"; @try { [self save]; } @catch (NSException *ignored) {} } }
  });
}
- (void)URLSession:(NSURLSession *)session task:(NSURLSessionTask *)task didCompleteWithError:(NSError *)error {
  dispatch_async(self.queue, ^{
    NSInteger page = [self pageFor:task]; if (!page) return; NSMutableDictionary *item = self.job[@"items"][page - 1];
    if (error || [item[@"invalid"] boolValue] || ![item[@"done"] boolValue]) {
      NSInteger attempts = [item[@"retries"] integerValue] + 1; item[@"retries"] = @(attempts); item[@"invalid"] = @NO;
      if (attempts >= 3) [self terminal:@"failed" error:@"Download failed or file validation failed"];
      else { [self enqueue:page]; [self save]; }
    } else {
      BOOL complete = YES; for (NSDictionary *value in self.job[@"items"]) if (![value[@"done"] boolValue]) { complete = NO; break; }
      if (complete) [self terminal:@"completed" error:nil]; else [self save];
    }
  });
}
- (void)URLSessionDidFinishEventsForBackgroundURLSession:(NSURLSession *)session {
  dispatch_async(self.queue, ^{ void (^completion)(void) = self.completion; self.completion = nil; if (completion) dispatch_async(dispatch_get_main_queue(), completion); });
}
@end
