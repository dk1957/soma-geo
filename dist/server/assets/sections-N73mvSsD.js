import { b as businessDataApi, a as backlinksApi, l as labsApi, k as keywordsDataApi, s as serpApi, o as onPageApi, c as aiOptimizationApi } from "./core-BTSo2kpy.js";
import { bl as assertOk, cA as buildTaskBilling, G as object, a3 as array, aj as record, cf as unknown, H as string, R as AppError, cB as parseTaskItems, cC as normalizeBacklinksSpamFilterOptions, cD as parseTaskTotalCount, Y as number, a4 as boolean, cE as isNoResultsTask, cF as MAX_TASKS_PER_POST, au as union, cG as isRecord } from "./index-CSpjggkr.js";
import { b as buildStoredLighthouseIssues, a as buildStoredLighthouseMetrics, c as scoreToPercent } from "./lighthouseStoredPayload-CV9yCkM2.js";
import "node:events";
import "node:stream";
import "node:async_hooks";
import "cloudflare:workers";
import "node:diagnostics_channel";
import "node:buffer";
import "node:crypto";
import "node:stream/web";
import "cloudflare:workflows";
import "./lighthouse-CxIZIYPF.js";
class BaseAiOptimizationLLmMentionsTargetElement {
  constructor(data) {
    if (data) {
      for (var property in data) {
        if (data.hasOwnProperty(property))
          this[property] = data[property];
      }
    }
    this.discriminator = "BaseSerpElementItem";
  }
  init(data) {
    if (data) {
      for (var property in data) {
        if (data.hasOwnProperty(property))
          this[property] = data[property];
      }
      this.search_scope = data["search_scope"];
      this.search_filter = data["search_filter"];
    }
  }
  static fromJS(data) {
    data = typeof data === "object" ? data : {};
    if (data["type"] === "domain") {
      let result2 = new AiOptimizationLLmMentionsDomainElement();
      result2.init(data);
      return result2;
    }
    if (data["type"] === "keyword") {
      let result2 = new AiOptimizationLLmMentionsKeywordElement();
      result2.init(data);
      return result2;
    }
    let result = new BaseAiOptimizationLLmMentionsTargetElement();
    result.init(data);
    return result;
  }
  toJSON(data) {
    data = typeof data === "object" ? data : {};
    data["search_scope"] = this.search_scope;
    data["search_filter"] = this.search_filter;
    return data;
  }
}
class AiOptimizationLLmMentionsDomainElement extends BaseAiOptimizationLLmMentionsTargetElement {
  constructor(data) {
    super(data);
  }
  init(data) {
    super.init(data);
    if (data) {
      for (var property in data) {
        if (data.hasOwnProperty(property))
          this[property] = data[property];
      }
      this.domain = data["domain"];
      this.include_subdomains = data["include_subdomains"];
      this.search_scope = data["search_scope"];
      this.search_filter = data["search_filter"];
    }
  }
  static fromJS(data) {
    data = typeof data === "object" ? data : {};
    let result = new AiOptimizationLLmMentionsDomainElement();
    result.init(data);
    return result;
  }
  toJSON(data) {
    data = typeof data === "object" ? data : {};
    super.toJSON(data);
    data["domain"] = this.domain;
    data["include_subdomains"] = this.include_subdomains;
    data["search_scope"] = this.search_scope;
    data["search_filter"] = this.search_filter;
    return data;
  }
}
class AiOptimizationLLmMentionsKeywordElement extends BaseAiOptimizationLLmMentionsTargetElement {
  constructor(data) {
    super(data);
  }
  init(data) {
    super.init(data);
    if (data) {
      for (var property in data) {
        if (data.hasOwnProperty(property))
          this[property] = data[property];
      }
      this.keyword = data["keyword"];
      this.match_type = data["match_type"];
      this.search_scope = data["search_scope"];
      this.search_filter = data["search_filter"];
    }
  }
  static fromJS(data) {
    data = typeof data === "object" ? data : {};
    let result = new AiOptimizationLLmMentionsKeywordElement();
    result.init(data);
    return result;
  }
  toJSON(data) {
    data = typeof data === "object" ? data : {};
    super.toJSON(data);
    data["keyword"] = this.keyword;
    data["match_type"] = this.match_type;
    data["search_scope"] = this.search_scope;
    data["search_filter"] = this.search_filter;
    return data;
  }
}
class AiOptimizationLLmMentionsCrossAggregateMetricsTargetInfo {
  constructor(data) {
    if (data) {
      for (var property in data) {
        if (data.hasOwnProperty(property))
          this[property] = data[property];
      }
    }
  }
  init(data) {
    if (data) {
      for (var property in data) {
        if (data.hasOwnProperty(property))
          this[property] = data[property];
      }
      if (Array.isArray(data["target"])) {
        this.target = [];
        for (let item of data["target"]) {
          this.target.push(BaseAiOptimizationLLmMentionsTargetElement.fromJS(item));
        }
      }
      this.aggregation_key = data["aggregation_key"];
    }
  }
  static fromJS(data) {
    data = typeof data === "object" ? data : {};
    let result = new AiOptimizationLLmMentionsCrossAggregateMetricsTargetInfo();
    result.init(data);
    return result;
  }
  toJSON(data) {
    data = typeof data === "object" ? data : {};
    data["target"] = null;
    if (Array.isArray(this.target)) {
      data["target"] = [];
      for (let item of this.target) {
        if (item && typeof item.toJSON === "function") {
          data["target"].push(item === null || item === void 0 ? void 0 : item.toJSON());
        }
      }
    }
    data["aggregation_key"] = this.aggregation_key;
    return data;
  }
}
class SerpApiStopCrawlOnMatchInfo {
  constructor(data) {
    if (data) {
      for (var property in data) {
        if (data.hasOwnProperty(property))
          this[property] = data[property];
      }
    }
  }
  init(data) {
    if (data) {
      for (var property in data) {
        if (data.hasOwnProperty(property))
          this[property] = data[property];
      }
      this.match_value = data["match_value"];
      this.match_type = data["match_type"];
    }
  }
  static fromJS(data) {
    data = typeof data === "object" ? data : {};
    let result = new SerpApiStopCrawlOnMatchInfo();
    result.init(data);
    return result;
  }
  toJSON(data) {
    data = typeof data === "object" ? data : {};
    data["match_value"] = this.match_value;
    data["match_type"] = this.match_type;
    return data;
  }
}
class LlmMessageChainItem {
  constructor(data) {
    if (data) {
      for (var property in data) {
        if (data.hasOwnProperty(property))
          this[property] = data[property];
      }
    }
  }
  init(data) {
    if (data) {
      for (var property in data) {
        if (data.hasOwnProperty(property))
          this[property] = data[property];
      }
      this.role = data["role"];
      this.message = data["message"];
    }
  }
  static fromJS(data) {
    data = typeof data === "object" ? data : {};
    let result = new LlmMessageChainItem();
    result.init(data);
    return result;
  }
  toJSON(data) {
    data = typeof data === "object" ? data : {};
    data["role"] = this.role;
    data["message"] = this.message;
    return data;
  }
}
class SerpGoogleOrganicTaskPostRequestInfo {
  constructor(data) {
    if (data) {
      for (var property in data) {
        if (data.hasOwnProperty(property))
          this[property] = data[property];
      }
    }
  }
  init(data) {
    if (data) {
      for (var property in data) {
        if (data.hasOwnProperty(property))
          this[property] = data[property];
      }
      this.keyword = data["keyword"];
      this.location_code = data["location_code"];
      this.language_code = data["language_code"];
      this.depth = data["depth"];
      this.device = data["device"];
      this.load_async_ai_overview = data["load_async_ai_overview"];
      this.pingback_url = data["pingback_url"];
      this.postback_url = data["postback_url"];
      this.postback_data = data["postback_data"];
      this.priority = data["priority"];
      this.location_name = data["location_name"];
      this.location_coordinate = data["location_coordinate"];
      this.language_name = data["language_name"];
      this.tag = data["tag"];
      this.os = data["os"];
      if (Array.isArray(data["stop_crawl_on_match"])) {
        this.stop_crawl_on_match = [];
        for (let item of data["stop_crawl_on_match"]) {
          this.stop_crawl_on_match.push(SerpApiStopCrawlOnMatchInfo.fromJS(item));
        }
      }
      this.match_type = data["match_type"];
      this.match_value = data["match_value"];
      this.max_crawl_pages = data["max_crawl_pages"];
      this.search_param = data["search_param"];
      this.remove_from_url = data["remove_from_url"];
      this.expand_ai_overview = data["expand_ai_overview"];
      this.people_also_ask_click_depth = data["people_also_ask_click_depth"];
      this.group_organic_results = data["group_organic_results"];
      this.calculate_rectangles = data["calculate_rectangles"];
      this.browser_screen_width = data["browser_screen_width"];
      this.browser_screen_height = data["browser_screen_height"];
      this.browser_screen_resolution_ratio = data["browser_screen_resolution_ratio"];
      this.url = data["url"];
      this.target_search_mode = data["target_search_mode"];
      this.find_targets_in = data["find_targets_in"];
      this.ignore_targets_in = data["ignore_targets_in"];
      this.se_domain = data["se_domain"];
    }
  }
  static fromJS(data) {
    data = typeof data === "object" ? data : {};
    let result = new SerpGoogleOrganicTaskPostRequestInfo();
    result.init(data);
    return result;
  }
  toJSON(data) {
    data = typeof data === "object" ? data : {};
    data["keyword"] = this.keyword;
    data["location_code"] = this.location_code;
    data["language_code"] = this.language_code;
    data["depth"] = this.depth;
    data["device"] = this.device;
    data["load_async_ai_overview"] = this.load_async_ai_overview;
    data["pingback_url"] = this.pingback_url;
    data["postback_url"] = this.postback_url;
    data["postback_data"] = this.postback_data;
    data["priority"] = this.priority;
    data["location_name"] = this.location_name;
    data["location_coordinate"] = this.location_coordinate;
    data["language_name"] = this.language_name;
    data["tag"] = this.tag;
    data["os"] = this.os;
    data["stop_crawl_on_match"] = null;
    if (Array.isArray(this.stop_crawl_on_match)) {
      data["stop_crawl_on_match"] = [];
      for (let item of this.stop_crawl_on_match) {
        if (item && typeof item.toJSON === "function") {
          data["stop_crawl_on_match"].push(item === null || item === void 0 ? void 0 : item.toJSON());
        }
      }
    }
    data["match_type"] = this.match_type;
    data["match_value"] = this.match_value;
    data["max_crawl_pages"] = this.max_crawl_pages;
    data["search_param"] = this.search_param;
    data["remove_from_url"] = this.remove_from_url;
    data["expand_ai_overview"] = this.expand_ai_overview;
    data["people_also_ask_click_depth"] = this.people_also_ask_click_depth;
    data["group_organic_results"] = this.group_organic_results;
    data["calculate_rectangles"] = this.calculate_rectangles;
    data["browser_screen_width"] = this.browser_screen_width;
    data["browser_screen_height"] = this.browser_screen_height;
    data["browser_screen_resolution_ratio"] = this.browser_screen_resolution_ratio;
    data["url"] = this.url;
    data["target_search_mode"] = this.target_search_mode;
    data["find_targets_in"] = this.find_targets_in;
    data["ignore_targets_in"] = this.ignore_targets_in;
    data["se_domain"] = this.se_domain;
    return data;
  }
}
class SerpGoogleOrganicLiveAdvancedRequestInfo {
  constructor(data) {
    if (data) {
      for (var property in data) {
        if (data.hasOwnProperty(property))
          this[property] = data[property];
      }
    }
  }
  init(data) {
    if (data) {
      for (var property in data) {
        if (data.hasOwnProperty(property))
          this[property] = data[property];
      }
      this.keyword = data["keyword"];
      this.location_code = data["location_code"];
      this.language_code = data["language_code"];
      this.depth = data["depth"];
      this.device = data["device"];
      this.load_async_ai_overview = data["load_async_ai_overview"];
      this.location_name = data["location_name"];
      this.language_name = data["language_name"];
      this.os = data["os"];
      this.tag = data["tag"];
      if (Array.isArray(data["stop_crawl_on_match"])) {
        this.stop_crawl_on_match = [];
        for (let item of data["stop_crawl_on_match"]) {
          this.stop_crawl_on_match.push(SerpApiStopCrawlOnMatchInfo.fromJS(item));
        }
      }
      this.match_type = data["match_type"];
      this.match_value = data["match_value"];
      this.max_crawl_pages = data["max_crawl_pages"];
      this.search_param = data["search_param"];
      this.remove_from_url = data["remove_from_url"];
      this.people_also_ask_click_depth = data["people_also_ask_click_depth"];
      this.group_organic_results = data["group_organic_results"];
      this.calculate_rectangles = data["calculate_rectangles"];
      this.browser_screen_width = data["browser_screen_width"];
      this.browser_screen_height = data["browser_screen_height"];
      this.browser_screen_resolution_ratio = data["browser_screen_resolution_ratio"];
      this.url = data["url"];
      this.location_coordinate = data["location_coordinate"];
      this.se_domain = data["se_domain"];
      this.target = data["target"];
      this.target_search_mode = data["target_search_mode"];
      this.find_targets_in = data["find_targets_in"];
      this.ignore_targets_in = data["ignore_targets_in"];
    }
  }
  static fromJS(data) {
    data = typeof data === "object" ? data : {};
    let result = new SerpGoogleOrganicLiveAdvancedRequestInfo();
    result.init(data);
    return result;
  }
  toJSON(data) {
    data = typeof data === "object" ? data : {};
    data["keyword"] = this.keyword;
    data["location_code"] = this.location_code;
    data["language_code"] = this.language_code;
    data["depth"] = this.depth;
    data["device"] = this.device;
    data["load_async_ai_overview"] = this.load_async_ai_overview;
    data["location_name"] = this.location_name;
    data["language_name"] = this.language_name;
    data["os"] = this.os;
    data["tag"] = this.tag;
    data["stop_crawl_on_match"] = null;
    if (Array.isArray(this.stop_crawl_on_match)) {
      data["stop_crawl_on_match"] = [];
      for (let item of this.stop_crawl_on_match) {
        if (item && typeof item.toJSON === "function") {
          data["stop_crawl_on_match"].push(item === null || item === void 0 ? void 0 : item.toJSON());
        }
      }
    }
    data["match_type"] = this.match_type;
    data["match_value"] = this.match_value;
    data["max_crawl_pages"] = this.max_crawl_pages;
    data["search_param"] = this.search_param;
    data["remove_from_url"] = this.remove_from_url;
    data["people_also_ask_click_depth"] = this.people_also_ask_click_depth;
    data["group_organic_results"] = this.group_organic_results;
    data["calculate_rectangles"] = this.calculate_rectangles;
    data["browser_screen_width"] = this.browser_screen_width;
    data["browser_screen_height"] = this.browser_screen_height;
    data["browser_screen_resolution_ratio"] = this.browser_screen_resolution_ratio;
    data["url"] = this.url;
    data["location_coordinate"] = this.location_coordinate;
    data["se_domain"] = this.se_domain;
    data["target"] = this.target;
    data["target_search_mode"] = this.target_search_mode;
    data["find_targets_in"] = this.find_targets_in;
    data["ignore_targets_in"] = this.ignore_targets_in;
    return data;
  }
}
class SerpGoogleMapsLiveAdvancedRequestInfo {
  constructor(data) {
    if (data) {
      for (var property in data) {
        if (data.hasOwnProperty(property))
          this[property] = data[property];
      }
    }
  }
  init(data) {
    if (data) {
      for (var property in data) {
        if (data.hasOwnProperty(property))
          this[property] = data[property];
      }
      this.keyword = data["keyword"];
      this.location_code = data["location_code"];
      this.language_code = data["language_code"];
      this.depth = data["depth"];
      this.device = data["device"];
      this.location_name = data["location_name"];
      this.language_name = data["language_name"];
      this.os = data["os"];
      this.tag = data["tag"];
      this.max_crawl_pages = data["max_crawl_pages"];
      this.url = data["url"];
      this.location_coordinate = data["location_coordinate"];
      this.se_domain = data["se_domain"];
      this.search_this_area = data["search_this_area"];
      this.search_places = data["search_places"];
    }
  }
  static fromJS(data) {
    data = typeof data === "object" ? data : {};
    let result = new SerpGoogleMapsLiveAdvancedRequestInfo();
    result.init(data);
    return result;
  }
  toJSON(data) {
    data = typeof data === "object" ? data : {};
    data["keyword"] = this.keyword;
    data["location_code"] = this.location_code;
    data["language_code"] = this.language_code;
    data["depth"] = this.depth;
    data["device"] = this.device;
    data["location_name"] = this.location_name;
    data["language_name"] = this.language_name;
    data["os"] = this.os;
    data["tag"] = this.tag;
    data["max_crawl_pages"] = this.max_crawl_pages;
    data["url"] = this.url;
    data["location_coordinate"] = this.location_coordinate;
    data["se_domain"] = this.se_domain;
    data["search_this_area"] = this.search_this_area;
    data["search_places"] = this.search_places;
    return data;
  }
}
class SerpGoogleLocalFinderLiveAdvancedRequestInfo {
  constructor(data) {
    if (data) {
      for (var property in data) {
        if (data.hasOwnProperty(property))
          this[property] = data[property];
      }
    }
  }
  init(data) {
    if (data) {
      for (var property in data) {
        if (data.hasOwnProperty(property))
          this[property] = data[property];
      }
      this.keyword = data["keyword"];
      this.location_code = data["location_code"];
      this.language_code = data["language_code"];
      this.depth = data["depth"];
      this.device = data["device"];
      this.location_name = data["location_name"];
      this.language_name = data["language_name"];
      this.os = data["os"];
      this.tag = data["tag"];
      this.priority = data["priority"];
      this.location_coordinate = data["location_coordinate"];
      this.min_rating = data["min_rating"];
      this.time_filter = data["time_filter"];
    }
  }
  static fromJS(data) {
    data = typeof data === "object" ? data : {};
    let result = new SerpGoogleLocalFinderLiveAdvancedRequestInfo();
    result.init(data);
    return result;
  }
  toJSON(data) {
    data = typeof data === "object" ? data : {};
    data["keyword"] = this.keyword;
    data["location_code"] = this.location_code;
    data["language_code"] = this.language_code;
    data["depth"] = this.depth;
    data["device"] = this.device;
    data["location_name"] = this.location_name;
    data["language_name"] = this.language_name;
    data["os"] = this.os;
    data["tag"] = this.tag;
    data["priority"] = this.priority;
    data["location_coordinate"] = this.location_coordinate;
    data["min_rating"] = this.min_rating;
    data["time_filter"] = this.time_filter;
    return data;
  }
}
class DataforseoLabsGoogleRelatedKeywordsLiveRequestInfo {
  constructor(data) {
    if (data) {
      for (var property in data) {
        if (data.hasOwnProperty(property))
          this[property] = data[property];
      }
    }
  }
  init(data) {
    if (data) {
      for (var property in data) {
        if (data.hasOwnProperty(property))
          this[property] = data[property];
      }
      this.keyword = data["keyword"];
      this.location_name = data["location_name"];
      this.location_code = data["location_code"];
      this.language_name = data["language_name"];
      this.language_code = data["language_code"];
      this.depth = data["depth"];
      this.include_seed_keyword = data["include_seed_keyword"];
      this.include_serp_info = data["include_serp_info"];
      this.include_clickstream_data = data["include_clickstream_data"];
      this.ignore_synonyms = data["ignore_synonyms"];
      this.replace_with_core_keyword = data["replace_with_core_keyword"];
      this.filters = data["filters"];
      this.order_by = data["order_by"];
      this.limit = data["limit"];
      this.offset = data["offset"];
      this.tag = data["tag"];
    }
  }
  static fromJS(data) {
    data = typeof data === "object" ? data : {};
    let result = new DataforseoLabsGoogleRelatedKeywordsLiveRequestInfo();
    result.init(data);
    return result;
  }
  toJSON(data) {
    data = typeof data === "object" ? data : {};
    data["keyword"] = this.keyword;
    data["location_name"] = this.location_name;
    data["location_code"] = this.location_code;
    data["language_name"] = this.language_name;
    data["language_code"] = this.language_code;
    data["depth"] = this.depth;
    data["include_seed_keyword"] = this.include_seed_keyword;
    data["include_serp_info"] = this.include_serp_info;
    data["include_clickstream_data"] = this.include_clickstream_data;
    data["ignore_synonyms"] = this.ignore_synonyms;
    data["replace_with_core_keyword"] = this.replace_with_core_keyword;
    data["filters"] = this.filters;
    data["order_by"] = this.order_by;
    data["limit"] = this.limit;
    data["offset"] = this.offset;
    data["tag"] = this.tag;
    return data;
  }
}
class DataforseoLabsGoogleKeywordSuggestionsLiveRequestInfo {
  constructor(data) {
    if (data) {
      for (var property in data) {
        if (data.hasOwnProperty(property))
          this[property] = data[property];
      }
    }
  }
  init(data) {
    if (data) {
      for (var property in data) {
        if (data.hasOwnProperty(property))
          this[property] = data[property];
      }
      this.keyword = data["keyword"];
      this.location_name = data["location_name"];
      this.location_code = data["location_code"];
      this.language_name = data["language_name"];
      this.language_code = data["language_code"];
      this.include_seed_keyword = data["include_seed_keyword"];
      this.include_serp_info = data["include_serp_info"];
      this.include_clickstream_data = data["include_clickstream_data"];
      this.exact_match = data["exact_match"];
      this.ignore_synonyms = data["ignore_synonyms"];
      this.filters = data["filters"];
      this.order_by = data["order_by"];
      this.limit = data["limit"];
      this.offset = data["offset"];
      this.offset_token = data["offset_token"];
      this.tag = data["tag"];
    }
  }
  static fromJS(data) {
    data = typeof data === "object" ? data : {};
    let result = new DataforseoLabsGoogleKeywordSuggestionsLiveRequestInfo();
    result.init(data);
    return result;
  }
  toJSON(data) {
    data = typeof data === "object" ? data : {};
    data["keyword"] = this.keyword;
    data["location_name"] = this.location_name;
    data["location_code"] = this.location_code;
    data["language_name"] = this.language_name;
    data["language_code"] = this.language_code;
    data["include_seed_keyword"] = this.include_seed_keyword;
    data["include_serp_info"] = this.include_serp_info;
    data["include_clickstream_data"] = this.include_clickstream_data;
    data["exact_match"] = this.exact_match;
    data["ignore_synonyms"] = this.ignore_synonyms;
    data["filters"] = this.filters;
    data["order_by"] = this.order_by;
    data["limit"] = this.limit;
    data["offset"] = this.offset;
    data["offset_token"] = this.offset_token;
    data["tag"] = this.tag;
    return data;
  }
}
class DataforseoLabsGoogleKeywordIdeasLiveRequestInfo {
  constructor(data) {
    if (data) {
      for (var property in data) {
        if (data.hasOwnProperty(property))
          this[property] = data[property];
      }
    }
  }
  init(data) {
    if (data) {
      for (var property in data) {
        if (data.hasOwnProperty(property))
          this[property] = data[property];
      }
      this.keywords = data["keywords"];
      this.location_name = data["location_name"];
      this.location_code = data["location_code"];
      this.language_name = data["language_name"];
      this.language_code = data["language_code"];
      this.closely_variants = data["closely_variants"];
      this.ignore_synonyms = data["ignore_synonyms"];
      this.include_serp_info = data["include_serp_info"];
      this.include_clickstream_data = data["include_clickstream_data"];
      this.limit = data["limit"];
      this.offset = data["offset"];
      this.offset_token = data["offset_token"];
      this.filters = data["filters"];
      this.order_by = data["order_by"];
      this.tag = data["tag"];
    }
  }
  static fromJS(data) {
    data = typeof data === "object" ? data : {};
    let result = new DataforseoLabsGoogleKeywordIdeasLiveRequestInfo();
    result.init(data);
    return result;
  }
  toJSON(data) {
    data = typeof data === "object" ? data : {};
    data["keywords"] = this.keywords;
    data["location_name"] = this.location_name;
    data["location_code"] = this.location_code;
    data["language_name"] = this.language_name;
    data["language_code"] = this.language_code;
    data["closely_variants"] = this.closely_variants;
    data["ignore_synonyms"] = this.ignore_synonyms;
    data["include_serp_info"] = this.include_serp_info;
    data["include_clickstream_data"] = this.include_clickstream_data;
    data["limit"] = this.limit;
    data["offset"] = this.offset;
    data["offset_token"] = this.offset_token;
    data["filters"] = this.filters;
    data["order_by"] = this.order_by;
    data["tag"] = this.tag;
    return data;
  }
}
class DataforseoLabsGoogleRankedKeywordsLiveRequestInfo {
  constructor(data) {
    if (data) {
      for (var property in data) {
        if (data.hasOwnProperty(property))
          this[property] = data[property];
      }
    }
  }
  init(data) {
    if (data) {
      for (var property in data) {
        if (data.hasOwnProperty(property))
          this[property] = data[property];
      }
      this.target = data["target"];
      this.location_name = data["location_name"];
      this.location_code = data["location_code"];
      this.language_name = data["language_name"];
      this.language_code = data["language_code"];
      this.ignore_synonyms = data["ignore_synonyms"];
      this.item_types = data["item_types"];
      this.include_clickstream_data = data["include_clickstream_data"];
      this.limit = data["limit"];
      this.offset = data["offset"];
      this.load_rank_absolute = data["load_rank_absolute"];
      this.historical_serp_mode = data["historical_serp_mode"];
      this.filters = data["filters"];
      this.order_by = data["order_by"];
      this.tag = data["tag"];
    }
  }
  static fromJS(data) {
    data = typeof data === "object" ? data : {};
    let result = new DataforseoLabsGoogleRankedKeywordsLiveRequestInfo();
    result.init(data);
    return result;
  }
  toJSON(data) {
    data = typeof data === "object" ? data : {};
    data["target"] = this.target;
    data["location_name"] = this.location_name;
    data["location_code"] = this.location_code;
    data["language_name"] = this.language_name;
    data["language_code"] = this.language_code;
    data["ignore_synonyms"] = this.ignore_synonyms;
    data["item_types"] = this.item_types;
    data["include_clickstream_data"] = this.include_clickstream_data;
    data["limit"] = this.limit;
    data["offset"] = this.offset;
    data["load_rank_absolute"] = this.load_rank_absolute;
    data["historical_serp_mode"] = this.historical_serp_mode;
    data["filters"] = this.filters;
    data["order_by"] = this.order_by;
    data["tag"] = this.tag;
    return data;
  }
}
class DataforseoLabsGoogleSerpCompetitorsLiveRequestInfo {
  constructor(data) {
    if (data) {
      for (var property in data) {
        if (data.hasOwnProperty(property))
          this[property] = data[property];
      }
    }
  }
  init(data) {
    if (data) {
      for (var property in data) {
        if (data.hasOwnProperty(property))
          this[property] = data[property];
      }
      this.keywords = data["keywords"];
      this.location_name = data["location_name"];
      this.location_code = data["location_code"];
      this.language_name = data["language_name"];
      this.language_code = data["language_code"];
      this.include_subdomains = data["include_subdomains"];
      this.item_types = data["item_types"];
      this.limit = data["limit"];
      this.offset = data["offset"];
      this.filters = data["filters"];
      this.order_by = data["order_by"];
      this.tag = data["tag"];
    }
  }
  static fromJS(data) {
    data = typeof data === "object" ? data : {};
    let result = new DataforseoLabsGoogleSerpCompetitorsLiveRequestInfo();
    result.init(data);
    return result;
  }
  toJSON(data) {
    data = typeof data === "object" ? data : {};
    data["keywords"] = this.keywords;
    data["location_name"] = this.location_name;
    data["location_code"] = this.location_code;
    data["language_name"] = this.language_name;
    data["language_code"] = this.language_code;
    data["include_subdomains"] = this.include_subdomains;
    data["item_types"] = this.item_types;
    data["limit"] = this.limit;
    data["offset"] = this.offset;
    data["filters"] = this.filters;
    data["order_by"] = this.order_by;
    data["tag"] = this.tag;
    return data;
  }
}
class DataforseoLabsGoogleRelevantPagesLiveRequestInfo {
  constructor(data) {
    if (data) {
      for (var property in data) {
        if (data.hasOwnProperty(property))
          this[property] = data[property];
      }
    }
  }
  init(data) {
    if (data) {
      for (var property in data) {
        if (data.hasOwnProperty(property))
          this[property] = data[property];
      }
      this.target = data["target"];
      this.location_name = data["location_name"];
      this.location_code = data["location_code"];
      this.language_name = data["language_name"];
      this.language_code = data["language_code"];
      this.item_types = data["item_types"];
      this.include_clickstream_data = data["include_clickstream_data"];
      this.limit = data["limit"];
      this.offset = data["offset"];
      this.historical_serp_mode = data["historical_serp_mode"];
      this.ignore_synonyms = data["ignore_synonyms"];
      this.filters = data["filters"];
      this.order_by = data["order_by"];
      this.tag = data["tag"];
    }
  }
  static fromJS(data) {
    data = typeof data === "object" ? data : {};
    let result = new DataforseoLabsGoogleRelevantPagesLiveRequestInfo();
    result.init(data);
    return result;
  }
  toJSON(data) {
    data = typeof data === "object" ? data : {};
    data["target"] = this.target;
    data["location_name"] = this.location_name;
    data["location_code"] = this.location_code;
    data["language_name"] = this.language_name;
    data["language_code"] = this.language_code;
    data["item_types"] = this.item_types;
    data["include_clickstream_data"] = this.include_clickstream_data;
    data["limit"] = this.limit;
    data["offset"] = this.offset;
    data["historical_serp_mode"] = this.historical_serp_mode;
    data["ignore_synonyms"] = this.ignore_synonyms;
    data["filters"] = this.filters;
    data["order_by"] = this.order_by;
    data["tag"] = this.tag;
    return data;
  }
}
class DataforseoLabsGoogleDomainRankOverviewLiveRequestInfo {
  constructor(data) {
    if (data) {
      for (var property in data) {
        if (data.hasOwnProperty(property))
          this[property] = data[property];
      }
    }
  }
  init(data) {
    if (data) {
      for (var property in data) {
        if (data.hasOwnProperty(property))
          this[property] = data[property];
      }
      this.target = data["target"];
      this.location_name = data["location_name"];
      this.location_code = data["location_code"];
      this.language_name = data["language_name"];
      this.language_code = data["language_code"];
      this.ignore_synonyms = data["ignore_synonyms"];
      this.limit = data["limit"];
      this.offset = data["offset"];
      this.tag = data["tag"];
    }
  }
  static fromJS(data) {
    data = typeof data === "object" ? data : {};
    let result = new DataforseoLabsGoogleDomainRankOverviewLiveRequestInfo();
    result.init(data);
    return result;
  }
  toJSON(data) {
    data = typeof data === "object" ? data : {};
    data["target"] = this.target;
    data["location_name"] = this.location_name;
    data["location_code"] = this.location_code;
    data["language_name"] = this.language_name;
    data["language_code"] = this.language_code;
    data["ignore_synonyms"] = this.ignore_synonyms;
    data["limit"] = this.limit;
    data["offset"] = this.offset;
    data["tag"] = this.tag;
    return data;
  }
}
class DataforseoLabsGoogleKeywordOverviewLiveRequestInfo {
  constructor(data) {
    if (data) {
      for (var property in data) {
        if (data.hasOwnProperty(property))
          this[property] = data[property];
      }
    }
  }
  init(data) {
    if (data) {
      for (var property in data) {
        if (data.hasOwnProperty(property))
          this[property] = data[property];
      }
      this.keywords = data["keywords"];
      this.location_name = data["location_name"];
      this.location_code = data["location_code"];
      this.language_name = data["language_name"];
      this.language_code = data["language_code"];
      this.include_serp_info = data["include_serp_info"];
      this.include_clickstream_data = data["include_clickstream_data"];
      this.tag = data["tag"];
    }
  }
  static fromJS(data) {
    data = typeof data === "object" ? data : {};
    let result = new DataforseoLabsGoogleKeywordOverviewLiveRequestInfo();
    result.init(data);
    return result;
  }
  toJSON(data) {
    data = typeof data === "object" ? data : {};
    data["keywords"] = this.keywords;
    data["location_name"] = this.location_name;
    data["location_code"] = this.location_code;
    data["language_name"] = this.language_name;
    data["language_code"] = this.language_code;
    data["include_serp_info"] = this.include_serp_info;
    data["include_clickstream_data"] = this.include_clickstream_data;
    data["tag"] = this.tag;
    return data;
  }
}
class KeywordsDataGoogleAdsSearchVolumeLiveRequestInfo {
  constructor(data) {
    if (data) {
      for (var property in data) {
        if (data.hasOwnProperty(property))
          this[property] = data[property];
      }
    }
  }
  init(data) {
    if (data) {
      for (var property in data) {
        if (data.hasOwnProperty(property))
          this[property] = data[property];
      }
      this.keywords = data["keywords"];
      this.location_name = data["location_name"];
      this.location_code = data["location_code"];
      this.location_coordinate = data["location_coordinate"];
      this.language_name = data["language_name"];
      this.language_code = data["language_code"];
      this.search_partners = data["search_partners"];
      this.date_from = data["date_from"];
      this.date_to = data["date_to"];
      this.include_adult_keywords = data["include_adult_keywords"];
      this.sort_by = data["sort_by"];
      this.tag = data["tag"];
    }
  }
  static fromJS(data) {
    data = typeof data === "object" ? data : {};
    let result = new KeywordsDataGoogleAdsSearchVolumeLiveRequestInfo();
    result.init(data);
    return result;
  }
  toJSON(data) {
    data = typeof data === "object" ? data : {};
    data["keywords"] = this.keywords;
    data["location_name"] = this.location_name;
    data["location_code"] = this.location_code;
    data["location_coordinate"] = this.location_coordinate;
    data["language_name"] = this.language_name;
    data["language_code"] = this.language_code;
    data["search_partners"] = this.search_partners;
    data["date_from"] = this.date_from;
    data["date_to"] = this.date_to;
    data["include_adult_keywords"] = this.include_adult_keywords;
    data["sort_by"] = this.sort_by;
    data["tag"] = this.tag;
    return data;
  }
}
class KeywordsDataGoogleAdsKeywordsForKeywordsLiveRequestInfo {
  constructor(data) {
    if (data) {
      for (var property in data) {
        if (data.hasOwnProperty(property))
          this[property] = data[property];
      }
    }
  }
  init(data) {
    if (data) {
      for (var property in data) {
        if (data.hasOwnProperty(property))
          this[property] = data[property];
      }
      this.keywords = data["keywords"];
      this.location_name = data["location_name"];
      this.location_code = data["location_code"];
      this.location_coordinate = data["location_coordinate"];
      this.language_name = data["language_name"];
      this.language_code = data["language_code"];
      this.search_partners = data["search_partners"];
      this.date_from = data["date_from"];
      this.date_to = data["date_to"];
      this.sort_by = data["sort_by"];
      this.include_adult_keywords = data["include_adult_keywords"];
      this.tag = data["tag"];
    }
  }
  static fromJS(data) {
    data = typeof data === "object" ? data : {};
    let result = new KeywordsDataGoogleAdsKeywordsForKeywordsLiveRequestInfo();
    result.init(data);
    return result;
  }
  toJSON(data) {
    data = typeof data === "object" ? data : {};
    data["keywords"] = this.keywords;
    data["location_name"] = this.location_name;
    data["location_code"] = this.location_code;
    data["location_coordinate"] = this.location_coordinate;
    data["language_name"] = this.language_name;
    data["language_code"] = this.language_code;
    data["search_partners"] = this.search_partners;
    data["date_from"] = this.date_from;
    data["date_to"] = this.date_to;
    data["sort_by"] = this.sort_by;
    data["include_adult_keywords"] = this.include_adult_keywords;
    data["tag"] = this.tag;
    return data;
  }
}
class BacklinksSummaryLiveRequestInfo {
  constructor(data) {
    if (data) {
      for (var property in data) {
        if (data.hasOwnProperty(property))
          this[property] = data[property];
      }
    }
  }
  init(data) {
    if (data) {
      for (var property in data) {
        if (data.hasOwnProperty(property))
          this[property] = data[property];
      }
      this.target = data["target"];
      this.include_subdomains = data["include_subdomains"];
      this.include_indirect_links = data["include_indirect_links"];
      this.exclude_internal_backlinks = data["exclude_internal_backlinks"];
      this.internal_list_limit = data["internal_list_limit"];
      this.backlinks_status_type = data["backlinks_status_type"];
      this.backlinks_filters = data["backlinks_filters"];
      this.rank_scale = data["rank_scale"];
      this.tag = data["tag"];
    }
  }
  static fromJS(data) {
    data = typeof data === "object" ? data : {};
    let result = new BacklinksSummaryLiveRequestInfo();
    result.init(data);
    return result;
  }
  toJSON(data) {
    data = typeof data === "object" ? data : {};
    data["target"] = this.target;
    data["include_subdomains"] = this.include_subdomains;
    data["include_indirect_links"] = this.include_indirect_links;
    data["exclude_internal_backlinks"] = this.exclude_internal_backlinks;
    data["internal_list_limit"] = this.internal_list_limit;
    data["backlinks_status_type"] = this.backlinks_status_type;
    data["backlinks_filters"] = this.backlinks_filters;
    data["rank_scale"] = this.rank_scale;
    data["tag"] = this.tag;
    return data;
  }
}
class BacklinksHistoryLiveRequestInfo {
  constructor(data) {
    if (data) {
      for (var property in data) {
        if (data.hasOwnProperty(property))
          this[property] = data[property];
      }
    }
  }
  init(data) {
    if (data) {
      for (var property in data) {
        if (data.hasOwnProperty(property))
          this[property] = data[property];
      }
      this.target = data["target"];
      this.date_from = data["date_from"];
      this.date_to = data["date_to"];
      this.rank_scale = data["rank_scale"];
      this.tag = data["tag"];
    }
  }
  static fromJS(data) {
    data = typeof data === "object" ? data : {};
    let result = new BacklinksHistoryLiveRequestInfo();
    result.init(data);
    return result;
  }
  toJSON(data) {
    data = typeof data === "object" ? data : {};
    data["target"] = this.target;
    data["date_from"] = this.date_from;
    data["date_to"] = this.date_to;
    data["rank_scale"] = this.rank_scale;
    data["tag"] = this.tag;
    return data;
  }
}
class BacklinksBacklinksLiveRequestInfo {
  constructor(data) {
    if (data) {
      for (var property in data) {
        if (data.hasOwnProperty(property))
          this[property] = data[property];
      }
    }
  }
  init(data) {
    if (data) {
      for (var property in data) {
        if (data.hasOwnProperty(property))
          this[property] = data[property];
      }
      this.target = data["target"];
      this.mode = data["mode"];
      this.custom_mode = data["custom_mode"];
      this.field = data["field"];
      this.value = data["value"];
      this.filters = data["filters"];
      this.order_by = data["order_by"];
      this.offset = data["offset"];
      this.search_after_token = data["search_after_token"];
      this.limit = data["limit"];
      this.backlinks_status_type = data["backlinks_status_type"];
      this.include_subdomains = data["include_subdomains"];
      this.include_indirect_links = data["include_indirect_links"];
      this.exclude_internal_backlinks = data["exclude_internal_backlinks"];
      this.rank_scale = data["rank_scale"];
      this.tag = data["tag"];
    }
  }
  static fromJS(data) {
    data = typeof data === "object" ? data : {};
    let result = new BacklinksBacklinksLiveRequestInfo();
    result.init(data);
    return result;
  }
  toJSON(data) {
    data = typeof data === "object" ? data : {};
    data["target"] = this.target;
    data["mode"] = this.mode;
    data["custom_mode"] = this.custom_mode;
    data["field"] = this.field;
    data["value"] = this.value;
    data["filters"] = this.filters;
    data["order_by"] = this.order_by;
    data["offset"] = this.offset;
    data["search_after_token"] = this.search_after_token;
    data["limit"] = this.limit;
    data["backlinks_status_type"] = this.backlinks_status_type;
    data["include_subdomains"] = this.include_subdomains;
    data["include_indirect_links"] = this.include_indirect_links;
    data["exclude_internal_backlinks"] = this.exclude_internal_backlinks;
    data["rank_scale"] = this.rank_scale;
    data["tag"] = this.tag;
    return data;
  }
}
class BacklinksDomainPagesSummaryLiveRequestInfo {
  constructor(data) {
    if (data) {
      for (var property in data) {
        if (data.hasOwnProperty(property))
          this[property] = data[property];
      }
    }
  }
  init(data) {
    if (data) {
      for (var property in data) {
        if (data.hasOwnProperty(property))
          this[property] = data[property];
      }
      this.target = data["target"];
      this.limit = data["limit"];
      this.offset = data["offset"];
      this.internal_list_limit = data["internal_list_limit"];
      this.backlinks_status_type = data["backlinks_status_type"];
      this.filters = data["filters"];
      this.order_by = data["order_by"];
      this.backlinks_filters = data["backlinks_filters"];
      this.include_subdomains = data["include_subdomains"];
      this.include_indirect_links = data["include_indirect_links"];
      this.exclude_internal_backlinks = data["exclude_internal_backlinks"];
      this.rank_scale = data["rank_scale"];
      this.tag = data["tag"];
    }
  }
  static fromJS(data) {
    data = typeof data === "object" ? data : {};
    let result = new BacklinksDomainPagesSummaryLiveRequestInfo();
    result.init(data);
    return result;
  }
  toJSON(data) {
    data = typeof data === "object" ? data : {};
    data["target"] = this.target;
    data["limit"] = this.limit;
    data["offset"] = this.offset;
    data["internal_list_limit"] = this.internal_list_limit;
    data["backlinks_status_type"] = this.backlinks_status_type;
    data["filters"] = this.filters;
    data["order_by"] = this.order_by;
    data["backlinks_filters"] = this.backlinks_filters;
    data["include_subdomains"] = this.include_subdomains;
    data["include_indirect_links"] = this.include_indirect_links;
    data["exclude_internal_backlinks"] = this.exclude_internal_backlinks;
    data["rank_scale"] = this.rank_scale;
    data["tag"] = this.tag;
    return data;
  }
}
class BacklinksReferringDomainsLiveRequestInfo {
  constructor(data) {
    if (data) {
      for (var property in data) {
        if (data.hasOwnProperty(property))
          this[property] = data[property];
      }
    }
  }
  init(data) {
    if (data) {
      for (var property in data) {
        if (data.hasOwnProperty(property))
          this[property] = data[property];
      }
      this.target = data["target"];
      this.limit = data["limit"];
      this.offset = data["offset"];
      this.internal_list_limit = data["internal_list_limit"];
      this.backlinks_status_type = data["backlinks_status_type"];
      this.filters = data["filters"];
      this.order_by = data["order_by"];
      this.backlinks_filters = data["backlinks_filters"];
      this.include_subdomains = data["include_subdomains"];
      this.include_indirect_links = data["include_indirect_links"];
      this.exclude_internal_backlinks = data["exclude_internal_backlinks"];
      this.rank_scale = data["rank_scale"];
      this.tag = data["tag"];
    }
  }
  static fromJS(data) {
    data = typeof data === "object" ? data : {};
    let result = new BacklinksReferringDomainsLiveRequestInfo();
    result.init(data);
    return result;
  }
  toJSON(data) {
    data = typeof data === "object" ? data : {};
    data["target"] = this.target;
    data["limit"] = this.limit;
    data["offset"] = this.offset;
    data["internal_list_limit"] = this.internal_list_limit;
    data["backlinks_status_type"] = this.backlinks_status_type;
    data["filters"] = this.filters;
    data["order_by"] = this.order_by;
    data["backlinks_filters"] = this.backlinks_filters;
    data["include_subdomains"] = this.include_subdomains;
    data["include_indirect_links"] = this.include_indirect_links;
    data["exclude_internal_backlinks"] = this.exclude_internal_backlinks;
    data["rank_scale"] = this.rank_scale;
    data["tag"] = this.tag;
    return data;
  }
}
class AiOptimizationLlmMentionsSearchLiveRequestInfo {
  constructor(data) {
    if (data) {
      for (var property in data) {
        if (data.hasOwnProperty(property))
          this[property] = data[property];
      }
    }
  }
  init(data) {
    if (data) {
      for (var property in data) {
        if (data.hasOwnProperty(property))
          this[property] = data[property];
      }
      if (Array.isArray(data["target"])) {
        this.target = [];
        for (let item of data["target"]) {
          this.target.push(BaseAiOptimizationLLmMentionsTargetElement.fromJS(item));
        }
      }
      this.domain = data["domain"];
      this.search_filter = data["search_filter"];
      this.search_scope = data["search_scope"];
      this.include_subdomains = data["include_subdomains"];
      this.keyword = data["keyword"];
      this.match_type = data["match_type"];
      this.location_name = data["location_name"];
      this.location_code = data["location_code"];
      this.language_name = data["language_name"];
      this.language_code = data["language_code"];
      this.platform = data["platform"];
      this.filters = data["filters"];
      this.order_by = data["order_by"];
      this.offset = data["offset"];
      this.search_after_token = data["search_after_token"];
      this.limit = data["limit"];
      this.tag = data["tag"];
    }
  }
  static fromJS(data) {
    data = typeof data === "object" ? data : {};
    let result = new AiOptimizationLlmMentionsSearchLiveRequestInfo();
    result.init(data);
    return result;
  }
  toJSON(data) {
    data = typeof data === "object" ? data : {};
    data["target"] = null;
    if (Array.isArray(this.target)) {
      data["target"] = [];
      for (let item of this.target) {
        if (item && typeof item.toJSON === "function") {
          data["target"].push(item === null || item === void 0 ? void 0 : item.toJSON());
        }
      }
    }
    data["domain"] = this.domain;
    data["search_filter"] = this.search_filter;
    data["search_scope"] = this.search_scope;
    data["include_subdomains"] = this.include_subdomains;
    data["keyword"] = this.keyword;
    data["match_type"] = this.match_type;
    data["location_name"] = this.location_name;
    data["location_code"] = this.location_code;
    data["language_name"] = this.language_name;
    data["language_code"] = this.language_code;
    data["platform"] = this.platform;
    data["filters"] = this.filters;
    data["order_by"] = this.order_by;
    data["offset"] = this.offset;
    data["search_after_token"] = this.search_after_token;
    data["limit"] = this.limit;
    data["tag"] = this.tag;
    return data;
  }
}
class AiOptimizationLlmMentionsTopPagesLiveRequestInfo {
  constructor(data) {
    if (data) {
      for (var property in data) {
        if (data.hasOwnProperty(property))
          this[property] = data[property];
      }
    }
  }
  init(data) {
    if (data) {
      for (var property in data) {
        if (data.hasOwnProperty(property))
          this[property] = data[property];
      }
      if (Array.isArray(data["target"])) {
        this.target = [];
        for (let item of data["target"]) {
          this.target.push(BaseAiOptimizationLLmMentionsTargetElement.fromJS(item));
        }
      }
      this.domain = data["domain"];
      this.search_filter = data["search_filter"];
      this.search_scope = data["search_scope"];
      this.include_subdomains = data["include_subdomains"];
      this.keyword = data["keyword"];
      this.match_type = data["match_type"];
      this.location_name = data["location_name"];
      this.location_code = data["location_code"];
      this.language_name = data["language_name"];
      this.language_code = data["language_code"];
      this.platform = data["platform"];
      this.links_scope = data["links_scope"];
      this.initial_dataset_filters = data["initial_dataset_filters"];
      this.items_list_limit = data["items_list_limit"];
      this.internal_list_limit = data["internal_list_limit"];
      this.tag = data["tag"];
    }
  }
  static fromJS(data) {
    data = typeof data === "object" ? data : {};
    let result = new AiOptimizationLlmMentionsTopPagesLiveRequestInfo();
    result.init(data);
    return result;
  }
  toJSON(data) {
    data = typeof data === "object" ? data : {};
    data["target"] = null;
    if (Array.isArray(this.target)) {
      data["target"] = [];
      for (let item of this.target) {
        if (item && typeof item.toJSON === "function") {
          data["target"].push(item === null || item === void 0 ? void 0 : item.toJSON());
        }
      }
    }
    data["domain"] = this.domain;
    data["search_filter"] = this.search_filter;
    data["search_scope"] = this.search_scope;
    data["include_subdomains"] = this.include_subdomains;
    data["keyword"] = this.keyword;
    data["match_type"] = this.match_type;
    data["location_name"] = this.location_name;
    data["location_code"] = this.location_code;
    data["language_name"] = this.language_name;
    data["language_code"] = this.language_code;
    data["platform"] = this.platform;
    data["links_scope"] = this.links_scope;
    data["initial_dataset_filters"] = this.initial_dataset_filters;
    data["items_list_limit"] = this.items_list_limit;
    data["internal_list_limit"] = this.internal_list_limit;
    data["tag"] = this.tag;
    return data;
  }
}
class AiOptimizationLlmMentionsAggregatedMetricsLiveRequestInfo {
  constructor(data) {
    if (data) {
      for (var property in data) {
        if (data.hasOwnProperty(property))
          this[property] = data[property];
      }
    }
  }
  init(data) {
    if (data) {
      for (var property in data) {
        if (data.hasOwnProperty(property))
          this[property] = data[property];
      }
      if (Array.isArray(data["target"])) {
        this.target = [];
        for (let item of data["target"]) {
          this.target.push(BaseAiOptimizationLLmMentionsTargetElement.fromJS(item));
        }
      }
      this.domain = data["domain"];
      this.search_filter = data["search_filter"];
      this.search_scope = data["search_scope"];
      this.include_subdomains = data["include_subdomains"];
      this.keyword = data["keyword"];
      this.match_type = data["match_type"];
      this.location_name = data["location_name"];
      this.location_code = data["location_code"];
      this.language_name = data["language_name"];
      this.language_code = data["language_code"];
      this.platform = data["platform"];
      this.initial_dataset_filters = data["initial_dataset_filters"];
      this.internal_list_limit = data["internal_list_limit"];
      this.tag = data["tag"];
    }
  }
  static fromJS(data) {
    data = typeof data === "object" ? data : {};
    let result = new AiOptimizationLlmMentionsAggregatedMetricsLiveRequestInfo();
    result.init(data);
    return result;
  }
  toJSON(data) {
    data = typeof data === "object" ? data : {};
    data["target"] = null;
    if (Array.isArray(this.target)) {
      data["target"] = [];
      for (let item of this.target) {
        if (item && typeof item.toJSON === "function") {
          data["target"].push(item === null || item === void 0 ? void 0 : item.toJSON());
        }
      }
    }
    data["domain"] = this.domain;
    data["search_filter"] = this.search_filter;
    data["search_scope"] = this.search_scope;
    data["include_subdomains"] = this.include_subdomains;
    data["keyword"] = this.keyword;
    data["match_type"] = this.match_type;
    data["location_name"] = this.location_name;
    data["location_code"] = this.location_code;
    data["language_name"] = this.language_name;
    data["language_code"] = this.language_code;
    data["platform"] = this.platform;
    data["initial_dataset_filters"] = this.initial_dataset_filters;
    data["internal_list_limit"] = this.internal_list_limit;
    data["tag"] = this.tag;
    return data;
  }
}
class AiOptimizationLlmMentionsCrossAggregatedMetricsLiveRequestInfo {
  constructor(data) {
    if (data) {
      for (var property in data) {
        if (data.hasOwnProperty(property))
          this[property] = data[property];
      }
    }
  }
  init(data) {
    if (data) {
      for (var property in data) {
        if (data.hasOwnProperty(property))
          this[property] = data[property];
      }
      if (Array.isArray(data["targets"])) {
        this.targets = [];
        for (let item of data["targets"]) {
          this.targets.push(AiOptimizationLLmMentionsCrossAggregateMetricsTargetInfo.fromJS(item));
        }
      }
      this.aggregation_key = data["aggregation_key"];
      this.target = data["target"];
      this.domain = data["domain"];
      this.search_filter = data["search_filter"];
      this.search_scope = data["search_scope"];
      this.include_subdomains = data["include_subdomains"];
      this.keyword = data["keyword"];
      this.match_type = data["match_type"];
      this.location_name = data["location_name"];
      this.location_code = data["location_code"];
      this.language_name = data["language_name"];
      this.language_code = data["language_code"];
      this.platform = data["platform"];
      this.initial_dataset_filters = data["initial_dataset_filters"];
      this.internal_list_limit = data["internal_list_limit"];
      this.tag = data["tag"];
    }
  }
  static fromJS(data) {
    data = typeof data === "object" ? data : {};
    let result = new AiOptimizationLlmMentionsCrossAggregatedMetricsLiveRequestInfo();
    result.init(data);
    return result;
  }
  toJSON(data) {
    data = typeof data === "object" ? data : {};
    data["targets"] = null;
    if (Array.isArray(this.targets)) {
      data["targets"] = [];
      for (let item of this.targets) {
        if (item && typeof item.toJSON === "function") {
          data["targets"].push(item === null || item === void 0 ? void 0 : item.toJSON());
        }
      }
    }
    data["aggregation_key"] = this.aggregation_key;
    data["target"] = this.target;
    data["domain"] = this.domain;
    data["search_filter"] = this.search_filter;
    data["search_scope"] = this.search_scope;
    data["include_subdomains"] = this.include_subdomains;
    data["keyword"] = this.keyword;
    data["match_type"] = this.match_type;
    data["location_name"] = this.location_name;
    data["location_code"] = this.location_code;
    data["language_name"] = this.language_name;
    data["language_code"] = this.language_code;
    data["platform"] = this.platform;
    data["initial_dataset_filters"] = this.initial_dataset_filters;
    data["internal_list_limit"] = this.internal_list_limit;
    data["tag"] = this.tag;
    return data;
  }
}
class AiOptimizationChatGptLlmResponsesLiveRequestInfo {
  constructor(data) {
    if (data) {
      for (var property in data) {
        if (data.hasOwnProperty(property))
          this[property] = data[property];
      }
    }
  }
  init(data) {
    if (data) {
      for (var property in data) {
        if (data.hasOwnProperty(property))
          this[property] = data[property];
      }
      this.user_prompt = data["user_prompt"];
      this.model_name = data["model_name"];
      this.max_output_tokens = data["max_output_tokens"];
      this.temperature = data["temperature"];
      this.top_p = data["top_p"];
      this.web_search = data["web_search"];
      this.force_web_search = data["force_web_search"];
      this.web_search_country_iso_code = data["web_search_country_iso_code"];
      this.web_search_city = data["web_search_city"];
      this.system_message = data["system_message"];
      if (Array.isArray(data["message_chain"])) {
        this.message_chain = [];
        for (let item of data["message_chain"]) {
          this.message_chain.push(LlmMessageChainItem.fromJS(item));
        }
      }
      this.tag = data["tag"];
    }
  }
  static fromJS(data) {
    data = typeof data === "object" ? data : {};
    let result = new AiOptimizationChatGptLlmResponsesLiveRequestInfo();
    result.init(data);
    return result;
  }
  toJSON(data) {
    data = typeof data === "object" ? data : {};
    data["user_prompt"] = this.user_prompt;
    data["model_name"] = this.model_name;
    data["max_output_tokens"] = this.max_output_tokens;
    data["temperature"] = this.temperature;
    data["top_p"] = this.top_p;
    data["web_search"] = this.web_search;
    data["force_web_search"] = this.force_web_search;
    data["web_search_country_iso_code"] = this.web_search_country_iso_code;
    data["web_search_city"] = this.web_search_city;
    data["system_message"] = this.system_message;
    data["message_chain"] = null;
    if (Array.isArray(this.message_chain)) {
      data["message_chain"] = [];
      for (let item of this.message_chain) {
        if (item && typeof item.toJSON === "function") {
          data["message_chain"].push(item === null || item === void 0 ? void 0 : item.toJSON());
        }
      }
    }
    data["tag"] = this.tag;
    return data;
  }
}
class AiOptimizationClaudeLlmResponsesLiveRequestInfo {
  constructor(data) {
    if (data) {
      for (var property in data) {
        if (data.hasOwnProperty(property))
          this[property] = data[property];
      }
    }
  }
  init(data) {
    if (data) {
      for (var property in data) {
        if (data.hasOwnProperty(property))
          this[property] = data[property];
      }
      this.user_prompt = data["user_prompt"];
      this.model_name = data["model_name"];
      this.max_output_tokens = data["max_output_tokens"];
      this.temperature = data["temperature"];
      this.top_p = data["top_p"];
      this.web_search = data["web_search"];
      this.force_web_search = data["force_web_search"];
      this.web_search_country_iso_code = data["web_search_country_iso_code"];
      this.web_search_city = data["web_search_city"];
      this.system_message = data["system_message"];
      if (Array.isArray(data["message_chain"])) {
        this.message_chain = [];
        for (let item of data["message_chain"]) {
          this.message_chain.push(LlmMessageChainItem.fromJS(item));
        }
      }
      this.tag = data["tag"];
    }
  }
  static fromJS(data) {
    data = typeof data === "object" ? data : {};
    let result = new AiOptimizationClaudeLlmResponsesLiveRequestInfo();
    result.init(data);
    return result;
  }
  toJSON(data) {
    data = typeof data === "object" ? data : {};
    data["user_prompt"] = this.user_prompt;
    data["model_name"] = this.model_name;
    data["max_output_tokens"] = this.max_output_tokens;
    data["temperature"] = this.temperature;
    data["top_p"] = this.top_p;
    data["web_search"] = this.web_search;
    data["force_web_search"] = this.force_web_search;
    data["web_search_country_iso_code"] = this.web_search_country_iso_code;
    data["web_search_city"] = this.web_search_city;
    data["system_message"] = this.system_message;
    data["message_chain"] = null;
    if (Array.isArray(this.message_chain)) {
      data["message_chain"] = [];
      for (let item of this.message_chain) {
        if (item && typeof item.toJSON === "function") {
          data["message_chain"].push(item === null || item === void 0 ? void 0 : item.toJSON());
        }
      }
    }
    data["tag"] = this.tag;
    return data;
  }
}
class AiOptimizationGeminiLlmResponsesLiveRequestInfo {
  constructor(data) {
    if (data) {
      for (var property in data) {
        if (data.hasOwnProperty(property))
          this[property] = data[property];
      }
    }
  }
  init(data) {
    if (data) {
      for (var property in data) {
        if (data.hasOwnProperty(property))
          this[property] = data[property];
      }
      this.user_prompt = data["user_prompt"];
      this.model_name = data["model_name"];
      this.max_output_tokens = data["max_output_tokens"];
      this.temperature = data["temperature"];
      this.top_p = data["top_p"];
      this.web_search = data["web_search"];
      this.system_message = data["system_message"];
      if (Array.isArray(data["message_chain"])) {
        this.message_chain = [];
        for (let item of data["message_chain"]) {
          this.message_chain.push(LlmMessageChainItem.fromJS(item));
        }
      }
      this.tag = data["tag"];
    }
  }
  static fromJS(data) {
    data = typeof data === "object" ? data : {};
    let result = new AiOptimizationGeminiLlmResponsesLiveRequestInfo();
    result.init(data);
    return result;
  }
  toJSON(data) {
    data = typeof data === "object" ? data : {};
    data["user_prompt"] = this.user_prompt;
    data["model_name"] = this.model_name;
    data["max_output_tokens"] = this.max_output_tokens;
    data["temperature"] = this.temperature;
    data["top_p"] = this.top_p;
    data["web_search"] = this.web_search;
    data["system_message"] = this.system_message;
    data["message_chain"] = null;
    if (Array.isArray(this.message_chain)) {
      data["message_chain"] = [];
      for (let item of this.message_chain) {
        if (item && typeof item.toJSON === "function") {
          data["message_chain"].push(item === null || item === void 0 ? void 0 : item.toJSON());
        }
      }
    }
    data["tag"] = this.tag;
    return data;
  }
}
class OnPageLighthouseLiveJsonRequestInfo {
  constructor(data) {
    if (data) {
      for (var property in data) {
        if (data.hasOwnProperty(property))
          this[property] = data[property];
      }
    }
  }
  init(data) {
    if (data) {
      for (var property in data) {
        if (data.hasOwnProperty(property))
          this[property] = data[property];
      }
      this.url = data["url"];
      this.for_mobile = data["for_mobile"];
      this.categories = data["categories"];
      this.audits = data["audits"];
      this.version = data["version"];
      this.language_name = data["language_name"];
      this.language_code = data["language_code"];
      this.tag = data["tag"];
    }
  }
  static fromJS(data) {
    data = typeof data === "object" ? data : {};
    let result = new OnPageLighthouseLiveJsonRequestInfo();
    result.init(data);
    return result;
  }
  toJSON(data) {
    data = typeof data === "object" ? data : {};
    data["url"] = this.url;
    data["for_mobile"] = this.for_mobile;
    data["categories"] = this.categories;
    data["audits"] = this.audits;
    data["version"] = this.version;
    data["language_name"] = this.language_name;
    data["language_code"] = this.language_code;
    data["tag"] = this.tag;
    return data;
  }
}
class BusinessDataBusinessListingsSearchLiveRequestInfo {
  constructor(data) {
    if (data) {
      for (var property in data) {
        if (data.hasOwnProperty(property))
          this[property] = data[property];
      }
    }
  }
  init(data) {
    if (data) {
      for (var property in data) {
        if (data.hasOwnProperty(property))
          this[property] = data[property];
      }
      this.categories = data["categories"];
      this.description = data["description"];
      this.title = data["title"];
      this.is_claimed = data["is_claimed"];
      this.location_coordinate = data["location_coordinate"];
      this.filters = data["filters"];
      this.order_by = data["order_by"];
      this.limit = data["limit"];
      this.offset = data["offset"];
      this.offset_token = data["offset_token"];
      this.tag = data["tag"];
    }
  }
  static fromJS(data) {
    data = typeof data === "object" ? data : {};
    let result = new BusinessDataBusinessListingsSearchLiveRequestInfo();
    result.init(data);
    return result;
  }
  toJSON(data) {
    data = typeof data === "object" ? data : {};
    data["categories"] = this.categories;
    data["description"] = this.description;
    data["title"] = this.title;
    data["is_claimed"] = this.is_claimed;
    data["location_coordinate"] = this.location_coordinate;
    data["filters"] = this.filters;
    data["order_by"] = this.order_by;
    data["limit"] = this.limit;
    data["offset"] = this.offset;
    data["offset_token"] = this.offset_token;
    data["tag"] = this.tag;
    return data;
  }
}
class BusinessDataGoogleQuestionsAndAnswersLiveRequestInfo {
  constructor(data) {
    if (data) {
      for (var property in data) {
        if (data.hasOwnProperty(property))
          this[property] = data[property];
      }
    }
  }
  init(data) {
    if (data) {
      for (var property in data) {
        if (data.hasOwnProperty(property))
          this[property] = data[property];
      }
      this.keyword = data["keyword"];
      this.location_name = data["location_name"];
      this.location_code = data["location_code"];
      this.location_coordinate = data["location_coordinate"];
      this.language_name = data["language_name"];
      this.language_code = data["language_code"];
      this.depth = data["depth"];
      this.tag = data["tag"];
    }
  }
  static fromJS(data) {
    data = typeof data === "object" ? data : {};
    let result = new BusinessDataGoogleQuestionsAndAnswersLiveRequestInfo();
    result.init(data);
    return result;
  }
  toJSON(data) {
    data = typeof data === "object" ? data : {};
    data["keyword"] = this.keyword;
    data["location_name"] = this.location_name;
    data["location_code"] = this.location_code;
    data["location_coordinate"] = this.location_coordinate;
    data["language_name"] = this.language_name;
    data["language_code"] = this.language_code;
    data["depth"] = this.depth;
    data["tag"] = this.tag;
    return data;
  }
}
async function fetchBusinessListingsSearch(input) {
  const response = await businessDataApi().businessListingsSearchLive([
    new BusinessDataBusinessListingsSearchLiveRequestInfo({
      categories: input.categories,
      title: input.title,
      location_coordinate: input.locationCoordinate,
      order_by: input.orderBy,
      limit: input.limit
    })
  ]);
  const task = assertOk(response, { treatNoResultsAsEmpty: true });
  return {
    data: task.result?.[0]?.items ?? [],
    billing: buildTaskBilling(task)
  };
}
const questionsResultSchema = object({
  items: array(record(string(), unknown())).nullable().optional(),
  items_without_answers: array(record(string(), unknown())).nullable().optional()
}).passthrough();
function combinedQuestionItems(results) {
  const list = Array.isArray(results) ? results : [];
  return list.flatMap((result) => {
    const parsed = questionsResultSchema.safeParse(result ?? {});
    if (!parsed.success) return [];
    return [
      ...parsed.data.items ?? [],
      ...parsed.data.items_without_answers ?? []
    ];
  });
}
async function fetchQuestionsAnswers(input) {
  const response = await businessDataApi().googleQuestionsAndAnswersLive([
    new BusinessDataGoogleQuestionsAndAnswersLiveRequestInfo({
      keyword: input.keyword,
      location_coordinate: input.locationCoordinate,
      language_code: input.languageCode,
      depth: input.depth
    })
  ]);
  const task = assertOk(response, { treatNoResultsAsEmpty: true });
  return {
    data: combinedQuestionItems(task.result),
    billing: buildTaskBilling(task)
  };
}
const BILLING_SIGNALS = [
  "insufficient funds",
  "balance is too low",
  "payment required",
  "billing",
  "balance",
  "problem billing",
  "recharged"
];
const BILLING_STATUS_CODES = /* @__PURE__ */ new Set([40200, 40210, 402]);
function createDataforseoBillingClassifier(config) {
  return (status, details, path) => {
    if (!path.includes(config.pathPrefix)) return null;
    const text = details.toLowerCase();
    const matchesBillingStatus = status != null && BILLING_STATUS_CODES.has(status);
    const matchesBillingText = BILLING_SIGNALS.some(
      (signal) => text.includes(signal)
    );
    if (matchesBillingStatus || matchesBillingText) {
      return new AppError(config.billingIssueCode, config.billingIssueMessage);
    }
    return null;
  };
}
const classifyBacklinksError = createDataforseoBillingClassifier({
  pathPrefix: "/backlinks/",
  billingIssueCode: "BACKLINKS_BILLING_ISSUE",
  billingIssueMessage: "The connected DataForSEO account has a billing or balance issue"
});
const backlinksSummaryItemSchema = object({
  target: string().optional(),
  rank: number().nullable().optional(),
  backlinks: number().nullable().optional(),
  referring_pages: number().nullable().optional(),
  referring_domains: number().nullable().optional(),
  broken_backlinks: number().nullable().optional(),
  broken_pages: number().nullable().optional(),
  new_backlinks: number().nullable().optional(),
  lost_backlinks: number().nullable().optional(),
  new_reffering_domains: number().nullable().optional(),
  lost_reffering_domains: number().nullable().optional(),
  new_referring_domains: number().nullable().optional(),
  lost_referring_domains: number().nullable().optional(),
  backlinks_spam_score: number().nullable().optional(),
  info: object({ target_spam_score: number().nullable().optional() }).passthrough().nullable().optional()
}).passthrough();
const backlinksItemSchema = object({
  domain_from: string().nullable().optional(),
  url_from: string().nullable().optional(),
  url_to: string().nullable().optional(),
  anchor: string().nullable().optional(),
  item_type: string().nullable().optional(),
  dofollow: boolean().nullable().optional(),
  rank: number().nullable().optional(),
  domain_from_rank: number().nullable().optional(),
  page_from_rank: number().nullable().optional(),
  backlinks_spam_score: number().nullable().optional(),
  backlink_spam_score: number().nullable().optional(),
  first_seen: string().nullable().optional(),
  last_visited: string().nullable().optional(),
  lost_date: string().nullable().optional(),
  is_new: boolean().nullable().optional(),
  is_lost: boolean().nullable().optional(),
  is_broken: boolean().nullable().optional(),
  links_count: number().nullable().optional(),
  rel_attributes: array(string()).nullable().optional(),
  attributes: array(string()).nullable().optional()
}).passthrough();
const referringDomainItemSchema = object({
  domain: string().nullable().optional(),
  backlinks: number().nullable().optional(),
  referring_pages: number().nullable().optional(),
  rank: number().nullable().optional(),
  first_seen: string().nullable().optional(),
  broken_backlinks: number().nullable().optional(),
  broken_pages: number().nullable().optional(),
  backlinks_spam_score: number().nullable().optional(),
  target_spam_score: number().nullable().optional()
}).passthrough();
const domainPageSummaryItemSchema = object({
  page: string().nullable().optional(),
  url: string().nullable().optional(),
  backlinks: number().nullable().optional(),
  referring_domains: number().nullable().optional(),
  rank: number().nullable().optional(),
  broken_backlinks: number().nullable().optional()
}).passthrough();
const backlinksHistoryItemSchema = object({
  date: string().nullable().optional(),
  rank: number().nullable().optional(),
  backlinks: number().nullable().optional(),
  referring_domains: number().nullable().optional(),
  new_backlinks: number().nullable().optional(),
  lost_backlinks: number().nullable().optional(),
  new_reffering_domains: number().nullable().optional(),
  lost_reffering_domains: number().nullable().optional(),
  new_referring_domains: number().nullable().optional(),
  lost_referring_domains: number().nullable().optional()
}).passthrough();
function buildCommonPayload(input) {
  return {
    target: input.target,
    include_subdomains: true,
    include_indirect_links: true,
    exclude_internal_backlinks: true,
    backlinks_status_type: "live",
    rank_scale: "one_hundred"
  };
}
const assertOptions$1 = (path) => ({ classify: classifyBacklinksError, classifyPath: path });
function combineFilters(userFilters, spamCondition) {
  const merged = [];
  if (userFilters && userFilters.length > 0) merged.push(...userFilters);
  if (spamCondition) {
    if (merged.length > 0) merged.push("and");
    merged.push(spamCondition);
  }
  return merged.length > 0 ? merged : void 0;
}
async function fetchBacklinksSummary(input) {
  const response = await backlinksApi(classifyBacklinksError).summaryLive([
    new BacklinksSummaryLiveRequestInfo(buildCommonPayload(input))
  ]);
  const task = assertOk(response, assertOptions$1("/v3/backlinks/summary/live"));
  const firstResult2 = task.result?.[0];
  if (firstResult2) {
    const parsed = backlinksSummaryItemSchema.safeParse(firstResult2);
    if (!parsed.success) {
      console.error(
        "dataforseo.backlinks-summary-live.invalid-result",
        parsed.error.issues.slice(0, 5)
      );
      throw new AppError(
        "INTERNAL_ERROR",
        "DataForSEO backlinks-summary-live returned an invalid response shape"
      );
    }
    return {
      data: parsed.data,
      billing: buildTaskBilling(task)
    };
  }
  return {
    data: {},
    billing: buildTaskBilling(task)
  };
}
async function fetchBacklinksRows(input) {
  const spamFilterOptions = normalizeBacklinksSpamFilterOptions(input);
  const filters = combineFilters(
    input.filters,
    spamFilterOptions.hideSpam ? ["backlink_spam_score", "<=", spamFilterOptions.spamThreshold] : void 0
  );
  const response = await backlinksApi(classifyBacklinksError).backlinksLive([
    new BacklinksBacklinksLiveRequestInfo({
      ...buildCommonPayload(input),
      limit: input.limit ?? 100,
      offset: input.offset,
      order_by: input.orderBy ?? ["rank,desc"],
      mode: input.mode,
      ...filters ? { filters } : {}
    })
  ]);
  const task = assertOk(
    response,
    assertOptions$1("/v3/backlinks/backlinks/live")
  );
  return {
    data: {
      items: parseTaskItems("backlinks-live", task, backlinksItemSchema),
      totalCount: parseTaskTotalCount(task)
    },
    billing: buildTaskBilling(task)
  };
}
async function fetchReferringDomains(input) {
  const spamFilterOptions = normalizeBacklinksSpamFilterOptions(input);
  const filters = combineFilters(
    input.filters,
    spamFilterOptions.hideSpam ? ["backlinks_spam_score", "<=", spamFilterOptions.spamThreshold] : void 0
  );
  const response = await backlinksApi(
    classifyBacklinksError
  ).referringDomainsLive([
    new BacklinksReferringDomainsLiveRequestInfo({
      ...buildCommonPayload(input),
      limit: input.limit ?? 100,
      offset: input.offset,
      order_by: input.orderBy ?? ["backlinks,desc"],
      ...filters ? { filters } : {}
    })
  ]);
  const task = assertOk(
    response,
    assertOptions$1("/v3/backlinks/referring_domains/live")
  );
  return {
    data: {
      items: parseTaskItems(
        "referring-domains-live",
        task,
        referringDomainItemSchema
      ),
      totalCount: parseTaskTotalCount(task)
    },
    billing: buildTaskBilling(task)
  };
}
async function fetchDomainPagesSummary(input) {
  const filters = input.filters && input.filters.length > 0 ? input.filters : void 0;
  const response = await backlinksApi(
    classifyBacklinksError
  ).domainPagesSummaryLive([
    new BacklinksDomainPagesSummaryLiveRequestInfo({
      ...buildCommonPayload(input),
      limit: input.limit ?? 100,
      offset: input.offset,
      order_by: input.orderBy ?? ["backlinks,desc"],
      ...filters ? { filters } : {}
    })
  ]);
  const task = assertOk(
    response,
    assertOptions$1("/v3/backlinks/domain_pages_summary/live")
  );
  return {
    data: {
      items: parseTaskItems(
        "domain-pages-summary-live",
        task,
        domainPageSummaryItemSchema
      ),
      totalCount: parseTaskTotalCount(task)
    },
    billing: buildTaskBilling(task)
  };
}
async function fetchBacklinksHistory(input) {
  const response = await backlinksApi(classifyBacklinksError).historyLive([
    new BacklinksHistoryLiveRequestInfo({
      target: input.target,
      date_from: input.dateFrom,
      date_to: input.dateTo,
      rank_scale: "one_hundred"
    })
  ]);
  const task = assertOk(response, assertOptions$1("/v3/backlinks/history/live"));
  return {
    data: parseTaskItems(
      "backlinks-history-live",
      task,
      backlinksHistoryItemSchema
    ),
    billing: buildTaskBilling(task)
  };
}
const rankedSerpItemSchema = object({
  url: string().nullable().optional(),
  relative_url: string().nullable().optional(),
  rank_absolute: number().nullable().optional(),
  etv: number().nullable().optional()
}).passthrough();
const domainRankedKeywordItemSchema = object({
  keyword_data: object({
    keyword: string().nullable().optional(),
    keyword_info: object({
      search_volume: number().nullable().optional(),
      cpc: number().nullable().optional(),
      keyword_difficulty: number().nullable().optional()
    }).passthrough().nullable().optional(),
    keyword_properties: object({
      keyword_difficulty: number().nullable().optional()
    }).passthrough().nullable().optional()
  }).passthrough().nullable().optional(),
  ranked_serp_element: object({
    serp_item: rankedSerpItemSchema.nullable().optional(),
    url: string().nullable().optional(),
    relative_url: string().nullable().optional(),
    rank_absolute: number().nullable().optional(),
    etv: number().nullable().optional()
  }).passthrough().nullable().optional(),
  keyword: string().nullable().optional()
}).passthrough();
async function fetchRelatedKeywords(input) {
  const response = await labsApi().googleRelatedKeywordsLive([
    new DataforseoLabsGoogleRelatedKeywordsLiveRequestInfo({
      keyword: input.keyword,
      location_code: input.locationCode,
      language_code: input.languageCode,
      limit: input.limit,
      depth: input.depth ?? 3,
      // Clickstream-refined volumes DOUBLE the request cost, so they are
      // opt-in — see specs/0004-keyword-data-source-routing.md.
      include_clickstream_data: input.includeClickstreamData ?? false,
      include_serp_info: false
    })
  ]);
  const task = assertOk(response);
  return {
    data: task.result?.[0]?.items ?? [],
    billing: buildTaskBilling(task)
  };
}
async function fetchKeywordSuggestions(input) {
  const response = await labsApi().googleKeywordSuggestionsLive([
    new DataforseoLabsGoogleKeywordSuggestionsLiveRequestInfo({
      keyword: input.keyword,
      location_code: input.locationCode,
      language_code: input.languageCode,
      limit: input.limit,
      include_clickstream_data: input.includeClickstreamData ?? false,
      include_serp_info: false,
      include_seed_keyword: true,
      ignore_synonyms: false,
      exact_match: false
    })
  ]);
  const task = assertOk(response);
  return {
    data: task.result?.[0]?.items ?? [],
    billing: buildTaskBilling(task)
  };
}
async function fetchKeywordIdeas(input) {
  const response = await labsApi().googleKeywordIdeasLive([
    new DataforseoLabsGoogleKeywordIdeasLiveRequestInfo({
      keywords: [input.keyword],
      location_code: input.locationCode,
      language_code: input.languageCode,
      limit: input.limit,
      include_clickstream_data: input.includeClickstreamData ?? false,
      include_serp_info: false,
      ignore_synonyms: false,
      closely_variants: false
    })
  ]);
  const task = assertOk(response);
  return {
    data: task.result?.[0]?.items ?? [],
    billing: buildTaskBilling(task)
  };
}
async function fetchDomainRankOverview(input) {
  const response = await labsApi().googleDomainRankOverviewLive([
    new DataforseoLabsGoogleDomainRankOverviewLiveRequestInfo({
      target: input.target,
      location_code: input.locationCode,
      language_code: input.languageCode,
      limit: 1
    })
  ]);
  const task = assertOk(response);
  return {
    data: task.result?.[0]?.items ?? [],
    billing: buildTaskBilling(task)
  };
}
async function fetchRankedKeywords(input) {
  const response = await labsApi().googleRankedKeywordsLive([
    new DataforseoLabsGoogleRankedKeywordsLiveRequestInfo({
      target: input.target,
      location_code: input.locationCode,
      language_code: input.languageCode,
      limit: input.limit,
      offset: input.offset,
      order_by: input.orderBy,
      filters: input.filters,
      item_types: input.itemTypes,
      include_subdomains: input.includeSubdomains
    })
  ]);
  const task = assertOk(response);
  return {
    data: {
      items: parseTaskItems(
        "google-ranked-keywords-live",
        task,
        domainRankedKeywordItemSchema
      ),
      totalCount: task.result?.[0]?.total_count ?? null
    },
    billing: buildTaskBilling(task)
  };
}
async function fetchRelevantPages(input) {
  const response = await labsApi().googleRelevantPagesLive([
    new DataforseoLabsGoogleRelevantPagesLiveRequestInfo({
      target: input.target,
      location_code: input.locationCode,
      language_code: input.languageCode,
      limit: input.limit,
      offset: input.offset,
      order_by: input.orderBy,
      filters: input.filters
    })
  ]);
  const task = assertOk(response);
  return {
    data: {
      items: task.result?.[0]?.items ?? [],
      totalCount: task.result?.[0]?.total_count ?? null
    },
    billing: buildTaskBilling(task)
  };
}
async function fetchKeywordOverview(input) {
  const response = await labsApi().googleKeywordOverviewLive([
    new DataforseoLabsGoogleKeywordOverviewLiveRequestInfo({
      keywords: input.keywords,
      location_code: input.locationCode,
      language_code: input.languageCode,
      include_clickstream_data: input.includeClickstreamData ?? false
    })
  ]);
  const task = assertOk(response);
  return {
    data: task.result?.[0]?.items ?? [],
    billing: buildTaskBilling(task)
  };
}
async function fetchSerpCompetitors(input) {
  const response = await labsApi().googleSerpCompetitorsLive([
    new DataforseoLabsGoogleSerpCompetitorsLiveRequestInfo({
      keywords: input.keywords,
      location_code: input.locationCode,
      language_code: input.languageCode,
      item_types: input.itemTypes,
      include_subdomains: input.includeSubdomains,
      limit: input.limit,
      offset: input.offset
    })
  ]);
  const task = assertOk(response);
  return {
    data: task.result?.[0]?.items ?? [],
    billing: buildTaskBilling(task)
  };
}
function taskItems(task) {
  return task.result ?? [];
}
async function fetchAdsSearchVolume(input) {
  const locationParams = input.locationName ? { location_name: input.locationName } : { location_code: input.locationCode };
  const response = await keywordsDataApi().googleAdsSearchVolumeLive([
    new KeywordsDataGoogleAdsSearchVolumeLiveRequestInfo({
      keywords: input.keywords,
      ...locationParams,
      language_code: input.languageCode
    })
  ]);
  const task = assertOk(response);
  return {
    data: taskItems(task),
    billing: buildTaskBilling(task)
  };
}
async function fetchAdsKeywordIdeas(input) {
  const response = await keywordsDataApi().googleAdsKeywordsForKeywordsLive([
    new KeywordsDataGoogleAdsKeywordsForKeywordsLiveRequestInfo({
      keywords: [input.keyword],
      location_code: input.locationCode,
      language_code: input.languageCode,
      sort_by: "search_volume"
    })
  ]);
  const task = assertOk(response);
  return {
    data: taskItems(task).slice(0, input.limit),
    billing: buildTaskBilling(task)
  };
}
function clampSerpDepth(depth) {
  return Math.min(100, Math.max(10, depth));
}
function stopCrawlOnTarget(targetDomain) {
  return {
    stop_crawl_on_match: [
      new SerpApiStopCrawlOnMatchInfo({
        match_value: targetDomain,
        match_type: "with_subdomains"
      })
    ],
    find_targets_in: ["organic"]
  };
}
const serpSnapshotItemSchema = object({
  type: string(),
  rank_group: number().nullable().optional(),
  rank_absolute: number().nullable().optional(),
  domain: string().nullable().optional(),
  title: string().nullable().optional(),
  url: string().nullable().optional(),
  description: string().nullable().optional(),
  breadcrumb: string().nullable().optional(),
  etv: number().nullable().optional(),
  estimated_paid_traffic_cost: number().nullable().optional(),
  backlinks_info: object({
    referring_domains: number().nullable().optional(),
    backlinks: number().nullable().optional()
  }).passthrough().nullable().optional(),
  rank_changes: object({
    previous_rank_absolute: number().nullable().optional(),
    is_new: boolean().nullable().optional(),
    is_up: boolean().nullable().optional(),
    is_down: boolean().nullable().optional()
  }).passthrough().nullable().optional()
}).passthrough();
async function fetchLiveSerp(input) {
  const response = await serpApi().googleOrganicLiveAdvanced([
    new SerpGoogleOrganicLiveAdvancedRequestInfo({
      keyword: input.keyword,
      location_code: input.locationCode,
      language_code: input.languageCode,
      device: "desktop",
      os: "windows",
      depth: 100
    })
  ]);
  const task = assertOk(response);
  return {
    data: parseTaskItems(
      "google-organic-live-advanced",
      task,
      serpSnapshotItemSchema
    ),
    billing: buildTaskBilling(task)
  };
}
function buildRankCheckResult(input, items) {
  const target = input.targetDomain.toLowerCase();
  const organicMatch = items.find((item) => {
    if (item.type !== "organic" || item.domain == null) return false;
    const domain = item.domain.toLowerCase();
    return domain === target || domain.endsWith(`.${target}`);
  });
  return {
    keywordId: input.keywordId,
    keyword: input.keyword,
    position: organicMatch ? organicMatch.rank_absolute ?? organicMatch.rank_group ?? null : null,
    url: organicMatch?.url ?? null,
    serpFeatures: [...new Set(items.map((item) => item.type).filter(Boolean))]
  };
}
async function fetchRankCheckSerp(input) {
  const depth = clampSerpDepth(input.depth);
  const locationParams = input.locationName ? { location_name: input.locationName } : { location_code: input.locationCode };
  const response = await serpApi().googleOrganicLiveAdvanced([
    new SerpGoogleOrganicLiveAdvancedRequestInfo({
      keyword: input.keyword,
      ...locationParams,
      language_code: input.languageCode,
      device: input.device,
      os: input.device === "desktop" ? "windows" : "android",
      depth,
      ...stopCrawlOnTarget(input.targetDomain)
    })
  ]);
  const task = assertOk(response, { treatNoResultsAsEmpty: true });
  const items = parseTaskItems(
    "google-organic-live-advanced",
    task,
    serpSnapshotItemSchema
  );
  return {
    data: buildRankCheckResult(input, items),
    billing: buildTaskBilling(task)
  };
}
async function postRankCheckTasks(input) {
  if (input.tasks.length === 0 || input.tasks.length > MAX_TASKS_PER_POST) {
    throw new AppError(
      "INTERNAL_ERROR",
      `task_post accepts 1-${MAX_TASKS_PER_POST} tasks, got ${input.tasks.length}`
    );
  }
  const depth = clampSerpDepth(input.depth);
  const locationParams = input.locationName ? { location_name: input.locationName } : { location_code: input.locationCode };
  const response = await serpApi().googleOrganicTaskPost(
    input.tasks.map(
      (task) => new SerpGoogleOrganicTaskPostRequestInfo({
        keyword: task.keyword,
        ...locationParams,
        language_code: input.languageCode,
        device: task.device,
        os: task.device === "desktop" ? "windows" : "android",
        depth,
        // Queued tasks are billed provisionally at full depth at post time;
        // task_get later reports the reduced actual cost when the crawl
        // stopped early. We meter customers on the post-time amount —
        // collection-time metering is a possible future optimization.
        ...stopCrawlOnTarget(input.targetDomain),
        // Echoed back on the response entry and task_get; used to map a
        // DataForSEO task id back to our keyword without relying on order.
        tag: `${task.keywordId}:${task.device}`
      })
    )
  );
  if (!response || response.status_code !== 2e4) {
    throw new AppError(
      "INTERNAL_ERROR",
      response?.status_message || "DataForSEO task_post failed"
    );
  }
  const byTag = new Map(
    input.tasks.map((task) => [`${task.keywordId}:${task.device}`, task])
  );
  const posted = [];
  let costUsd = 0;
  for (const entry of response.tasks ?? []) {
    costUsd += entry.cost ?? 0;
    const tag = entry.data?.tag;
    const task = typeof tag === "string" ? byTag.get(tag) : void 0;
    if (entry.status_code !== 20100 || !entry.id || !task) {
      console.warn(
        `dataforseo.task_post.rejected-entry (${entry.status_code}): ${entry.status_message}`
      );
      continue;
    }
    posted.push({ ...task, taskId: entry.id });
  }
  return {
    data: posted,
    billing: {
      path: ["v3", "serp", "google", "organic", "task_post"],
      costUsd
    }
  };
}
const TASK_IN_PROGRESS_STATUS_CODES = /* @__PURE__ */ new Set([20100, 40601, 40602]);
async function fetchRankCheckTaskResult(input) {
  const response = await serpApi().googleOrganicTaskGetAdvanced(input.taskId);
  const task = response?.tasks?.[0];
  if (!response || response.status_code !== 2e4 || !task) {
    throw new AppError(
      "INTERNAL_ERROR",
      response?.status_message || "DataForSEO task_get failed"
    );
  }
  if (task.status_code !== void 0 && TASK_IN_PROGRESS_STATUS_CODES.has(task.status_code)) {
    return { status: "pending" };
  }
  if (task.status_code !== 2e4) {
    if (!isNoResultsTask(task)) {
      return {
        status: "failed",
        message: task.status_message || `DataForSEO task failed (${task.status_code})`
      };
    }
    return {
      status: "completed",
      result: buildRankCheckResult(input, [])
    };
  }
  const items = parseTaskItems(
    "google-organic-task-get-advanced",
    task,
    serpSnapshotItemSchema
  );
  return { status: "completed", result: buildRankCheckResult(input, items) };
}
async function fetchLocalSerp(input) {
  const os = input.device === "desktop" ? "windows" : "android";
  if (input.searchType === "maps") {
    const response2 = await serpApi().googleMapsLiveAdvanced([
      new SerpGoogleMapsLiveAdvancedRequestInfo({
        keyword: input.keyword,
        location_coordinate: input.locationCoordinate,
        language_code: input.languageCode,
        device: input.device,
        os,
        depth: input.depth,
        search_places: input.searchPlaces
      })
    ]);
    const task2 = assertOk(response2);
    return {
      data: task2.result?.[0]?.items ?? [],
      billing: buildTaskBilling(task2)
    };
  }
  const response = await serpApi().googleLocalFinderLiveAdvanced([
    new SerpGoogleLocalFinderLiveAdvancedRequestInfo({
      keyword: input.keyword,
      location_coordinate: input.locationCoordinate,
      language_code: input.languageCode,
      device: input.device,
      os,
      depth: input.depth
    })
  ]);
  const task = assertOk(response);
  return {
    data: task.result?.[0]?.items ?? [],
    billing: buildTaskBilling(task)
  };
}
const requestCategories = [
  "performance",
  "accessibility",
  "best_practices",
  "seo"
];
const lighthouseAuditItemsSchema = union([
  array(record(string(), unknown())),
  record(string(), unknown())
]).transform((items) => Array.isArray(items) ? items : [items]);
const lighthouseAuditSchema = object({
  score: number().nullable().optional(),
  displayValue: string().optional(),
  numericValue: number().optional(),
  title: string().optional(),
  description: string().optional(),
  scoreDisplayMode: string().optional(),
  details: object({
    overallSavingsMs: number().optional(),
    overallSavingsBytes: number().optional(),
    items: lighthouseAuditItemsSchema.optional()
  }).passthrough().optional()
}).passthrough();
const lighthouseCategorySchema = object({
  score: number().nullable().optional(),
  auditRefs: array(
    object({
      id: string().optional()
    }).passthrough()
  ).optional()
}).passthrough();
const lighthouseResponseSchema = object({
  requestedUrl: string().optional(),
  finalUrl: string().optional(),
  lighthouseVersion: string().optional(),
  categories: record(string(), lighthouseCategorySchema).optional().default({}),
  audits: record(string(), lighthouseAuditSchema).optional().default({})
}).passthrough();
const dataforseoTaskSchema = object({
  id: string().optional(),
  cost: number().optional(),
  status_code: number().optional(),
  status_message: string().optional(),
  result: array(lighthouseResponseSchema).optional()
}).passthrough();
const dataforseoLighthouseResponseSchema = object({
  status_code: number().optional(),
  status_message: string().optional(),
  tasks: array(dataforseoTaskSchema).optional()
}).passthrough();
function summarizeZodIssues(error, maxIssues = 3) {
  return error.issues.slice(0, maxIssues).map((issue) => {
    const path = issue.path.length > 0 ? issue.path.join(".") : "<root>";
    return `${path}: ${issue.message}`;
  }).join("; ");
}
function parseDataforseoLighthousePayload(payload, input) {
  const parsed = dataforseoLighthouseResponseSchema.safeParse(payload);
  if (!parsed.success) {
    throw new Error(
      `DataForSEO Lighthouse returned an invalid response: ${summarizeZodIssues(parsed.error)}`
    );
  }
  if (parsed.data.status_code !== 2e4) {
    throw new Error(
      parsed.data.status_message ?? "DataForSEO Lighthouse request failed"
    );
  }
  const task = parsed.data.tasks?.[0];
  if (!task) {
    throw new Error("DataForSEO Lighthouse response missing task");
  }
  if (task.status_code !== 2e4) {
    throw new Error(task.status_message ?? "DataForSEO Lighthouse task failed");
  }
  const result = task.result?.[0];
  if (!result) {
    throw new Error("DataForSEO Lighthouse response missing result");
  }
  const fetchedAt = (/* @__PURE__ */ new Date()).toISOString();
  const categories = result.categories ?? {};
  const audits = result.audits ?? {};
  const issueReport = buildStoredLighthouseIssues({ audits, categories });
  const metrics = buildStoredLighthouseMetrics({ audits });
  const storedPayload = {
    version: 2,
    source: "dataforseo-lighthouse",
    hasIssueDetails: issueReport.hasIssueDetails,
    metadata: {
      requestedUrl: result.requestedUrl ?? input.url,
      finalUrl: result.finalUrl ?? input.url,
      strategy: input.strategy,
      fetchedAt,
      lighthouseVersion: result.lighthouseVersion ?? null,
      taskId: task.id ?? null,
      cost: task.cost ?? null
    },
    scores: {
      performance: scoreToPercent(categories.performance?.score),
      accessibility: scoreToPercent(categories.accessibility?.score),
      "best-practices": scoreToPercent(categories["best-practices"]?.score),
      seo: scoreToPercent(categories.seo?.score)
    },
    metrics,
    issues: issueReport.issues
  };
  const allScoresMissing = Object.values(storedPayload.scores).every(
    (score) => score == null
  );
  if (allScoresMissing) {
    throw new Error(
      `DataForSEO Lighthouse returned no category scores for ${storedPayload.metadata.finalUrl}`
    );
  }
  return storedPayload;
}
async function fetchLighthouseResult(input) {
  const response = await onPageApi().lighthouseLiveJson([
    new OnPageLighthouseLiveJsonRequestInfo({
      url: input.url,
      for_mobile: input.strategy === "mobile",
      categories: [...requestCategories]
    })
  ]);
  const task = assertOk(response);
  const data = parseDataforseoLighthousePayload(response, input);
  return { data, billing: buildTaskBilling(task) };
}
const monthlyVolumeSchema = object({
  year: number().int(),
  month: number().int().min(1).max(12),
  search_volume: number().nullable().optional()
}).passthrough();
const mentionSourceSchema = object({
  url: string().nullable().optional(),
  title: string().nullable().optional(),
  domain: string().nullable().optional()
}).passthrough();
const brandEntitySchema = object({
  title: string().nullable().optional()
}).passthrough();
const llmMentionItemSchema = object({
  question: string().nullable().optional(),
  sources: array(mentionSourceSchema).nullable().optional(),
  ai_search_volume: number().nullable().optional(),
  monthly_searches: array(monthlyVolumeSchema).nullable().optional(),
  first_response_at: string().nullable().optional(),
  last_response_at: string().nullable().optional(),
  brand_entities: array(brandEntitySchema).nullable().optional()
}).passthrough();
const groupElementSchema = object({
  type: string().nullable().optional(),
  key: string().nullable().optional(),
  mentions: number().nullable().optional(),
  ai_search_volume: number().nullable().optional(),
  impressions: number().nullable().optional()
}).passthrough();
const llmAggregatedTotalSchema = object({
  platform: array(groupElementSchema).nullable().optional()
}).passthrough();
const llmTopPagesItemSchema = object({
  key: string().nullable().optional(),
  platform: array(groupElementSchema).nullable().optional()
}).passthrough();
const llmCrossAggregatedItemSchema = object({
  // The shared SDK type AiOptimizationLlmMentionssLiveItem documents `key` as
  // the URL of a found page, but for cross_aggregated `key` is the request
  // aggregation_key (the brand label).
  key: string().nullable().optional(),
  platform: array(groupElementSchema).nullable().optional()
}).passthrough();
const responseAnnotationSchema = object({
  type: string().nullable().optional(),
  title: string().nullable().optional(),
  url: string().nullable().optional()
}).passthrough();
const responseSectionSchema = object({
  type: string().nullable().optional(),
  text: string().nullable().optional(),
  annotations: array(responseAnnotationSchema).nullable().optional()
}).passthrough();
const responseItemSchema = object({
  type: string().nullable().optional(),
  sections: array(responseSectionSchema).nullable().optional()
}).passthrough();
const llmResponseResultSchema = object({
  model_name: string().nullable().optional(),
  output_tokens: number().nullable().optional(),
  web_search: boolean().nullable().optional(),
  items: array(responseItemSchema).nullable().optional(),
  fan_out_queries: array(string()).nullable().optional()
}).passthrough();
const classifyAiSearchError = createDataforseoBillingClassifier({
  pathPrefix: "/ai_optimization/",
  billingIssueCode: "AI_SEARCH_BILLING_ISSUE",
  billingIssueMessage: "The connected DataForSEO account has a billing or balance issue"
});
const assertOptions = (path) => ({ classify: classifyAiSearchError, classifyPath: path });
function clampLimit(value, min, max) {
  return Math.min(max, Math.max(min, Math.floor(value)));
}
function targetList(target) {
  return [
    "domain" in target ? new AiOptimizationLLmMentionsDomainElement(target) : new AiOptimizationLLmMentionsKeywordElement(target)
  ];
}
function firstResult(task) {
  const first = task.result?.[0];
  return isRecord(first) ? first : null;
}
async function fetchLlmMentionsSearch(input) {
  const response = await aiOptimizationApi(
    classifyAiSearchError
  ).llmMentionsSearchLive([
    new AiOptimizationLlmMentionsSearchLiveRequestInfo({
      target: targetList(input.target),
      platform: input.platform,
      location_code: input.locationCode,
      language_code: input.languageCode,
      limit: clampLimit(input.limit ?? 100, 1, 1e3)
    })
  ]);
  const task = assertOk(
    response,
    assertOptions("/v3/ai_optimization/llm_mentions/search/live")
  );
  const items = array(llmMentionItemSchema).safeParse(firstResult(task)?.items ?? []);
  if (!items.success) {
    throw new AppError(
      "INTERNAL_ERROR",
      "DataForSEO llm_mentions/search returned an invalid mention items shape"
    );
  }
  return { data: items.data, billing: buildTaskBilling(task) };
}
async function fetchLlmAggregatedMetrics(input) {
  const response = await aiOptimizationApi(
    classifyAiSearchError
  ).llmMentionsAggregatedMetricsLive([
    new AiOptimizationLlmMentionsAggregatedMetricsLiveRequestInfo({
      target: targetList(input.target),
      platform: input.platform,
      location_code: input.locationCode,
      language_code: input.languageCode,
      internal_list_limit: clampLimit(input.internalListLimit ?? 10, 1, 20)
    })
  ]);
  const task = assertOk(
    response,
    assertOptions("/v3/ai_optimization/llm_mentions/aggregated_metrics/live")
  );
  const total = llmAggregatedTotalSchema.safeParse(
    firstResult(task)?.total ?? {}
  );
  if (!total.success) {
    throw new AppError(
      "INTERNAL_ERROR",
      "DataForSEO llm_mentions/aggregated_metrics returned an invalid shape"
    );
  }
  return { data: total.data, billing: buildTaskBilling(task) };
}
async function fetchLlmTopPages(input) {
  const response = await aiOptimizationApi(
    classifyAiSearchError
  ).llmMentionsTopPagesLive([
    new AiOptimizationLlmMentionsTopPagesLiveRequestInfo({
      target: targetList(input.target),
      platform: input.platform,
      location_code: input.locationCode,
      language_code: input.languageCode,
      links_scope: "sources",
      items_list_limit: clampLimit(input.itemsListLimit ?? 10, 1, 10),
      internal_list_limit: 5
    })
  ]);
  const task = assertOk(
    response,
    assertOptions("/v3/ai_optimization/llm_mentions/top_pages/live")
  );
  const items = array(llmTopPagesItemSchema).safeParse(firstResult(task)?.items ?? []);
  if (!items.success) {
    throw new AppError(
      "INTERNAL_ERROR",
      "DataForSEO llm_mentions/top_pages returned an invalid shape"
    );
  }
  return { data: items.data, billing: buildTaskBilling(task) };
}
async function fetchLlmCrossAggregatedMetrics(input) {
  if (input.groups.length < 2 || input.groups.length > 10) {
    throw new AppError(
      "VALIDATION_ERROR",
      "DataForSEO llm_mentions/cross_aggregated_metrics requires 2 to 10 target groups"
    );
  }
  const response = await aiOptimizationApi(
    classifyAiSearchError
  ).llmMentionsCrossAggregatedMetricsLive([
    new AiOptimizationLlmMentionsCrossAggregatedMetricsLiveRequestInfo({
      targets: input.groups.map(
        (group) => new AiOptimizationLLmMentionsCrossAggregateMetricsTargetInfo({
          aggregation_key: group.key,
          target: targetList(group.target)
        })
      ),
      platform: input.platform,
      location_code: input.locationCode,
      language_code: input.languageCode,
      internal_list_limit: clampLimit(input.internalListLimit ?? 5, 1, 10)
    })
  ]);
  const task = assertOk(
    response,
    assertOptions(
      "/v3/ai_optimization/llm_mentions/cross_aggregated_metrics/live"
    )
  );
  const items = array(llmCrossAggregatedItemSchema).safeParse(firstResult(task)?.items ?? []);
  if (!items.success) {
    throw new AppError(
      "INTERNAL_ERROR",
      "DataForSEO llm_mentions/cross_aggregated_metrics returned an invalid shape"
    );
  }
  return { data: items.data, billing: buildTaskBilling(task) };
}
const ACCEPTED_LLM_MODEL_NAMES = {
  chat_gpt: /* @__PURE__ */ new Set(["gpt-5"]),
  claude: /* @__PURE__ */ new Set(["claude-sonnet-4-5", "claude-sonnet-4-6"]),
  gemini: /* @__PURE__ */ new Set(["gemini-2.5-pro"]),
  perplexity: /* @__PURE__ */ new Set(["sonar-reasoning-pro", "sonar-pro", "sonar"])
};
function buildPerplexityLlmResponseRequest(fields) {
  return {
    ...fields,
    init(data) {
      if (isRecord(data)) Object.assign(this, data);
    },
    toJSON(data) {
      return {
        ...isRecord(data) ? data : {},
        ...fields
      };
    }
  };
}
async function fetchLlmResponse(input) {
  if (!ACCEPTED_LLM_MODEL_NAMES[input.modelSlug].has(input.modelName)) {
    throw new AppError(
      "VALIDATION_ERROR",
      `Unsupported DataForSEO model_name "${input.modelName}" for ${input.modelSlug}`
    );
  }
  const supportsCountry = input.modelSlug !== "gemini";
  const fields = {
    user_prompt: input.userPrompt,
    model_name: input.modelName,
    web_search: input.webSearch ?? true,
    max_output_tokens: clampLimit(input.maxOutputTokens ?? 1024, 256, 4096),
    ...supportsCountry && input.webSearchCountryCode ? { web_search_country_iso_code: input.webSearchCountryCode } : {}
  };
  const api = aiOptimizationApi(classifyAiSearchError);
  const response = input.modelSlug === "chat_gpt" ? await api.chatGptLlmResponsesLive([
    new AiOptimizationChatGptLlmResponsesLiveRequestInfo(fields)
  ]) : input.modelSlug === "claude" ? await api.claudeLlmResponsesLive([
    new AiOptimizationClaudeLlmResponsesLiveRequestInfo(fields)
  ]) : input.modelSlug === "gemini" ? await api.geminiLlmResponsesLive([
    new AiOptimizationGeminiLlmResponsesLiveRequestInfo(fields)
  ]) : await api.perplexityLlmResponsesLive([
    // The generated Perplexity request class drops `web_search` in
    // toJSON(), while the SDK method only JSON.stringify's this body.
    buildPerplexityLlmResponseRequest(fields)
  ]);
  const task = assertOk(
    response,
    assertOptions(`/v3/ai_optimization/${input.modelSlug}/llm_responses/live`)
  );
  const result = llmResponseResultSchema.safeParse(firstResult(task) ?? {});
  if (!result.success) {
    throw new AppError(
      "INTERNAL_ERROR",
      "DataForSEO llm_responses returned an invalid response shape"
    );
  }
  return { data: result.data, billing: buildTaskBilling(task) };
}
export {
  fetchAdsKeywordIdeas,
  fetchAdsSearchVolume,
  fetchBacklinksHistory,
  fetchBacklinksRows,
  fetchBacklinksSummary,
  fetchBusinessListingsSearch,
  fetchDomainPagesSummary,
  fetchDomainRankOverview,
  fetchKeywordIdeas,
  fetchKeywordOverview,
  fetchKeywordSuggestions,
  fetchLighthouseResult,
  fetchLiveSerp,
  fetchLlmAggregatedMetrics,
  fetchLlmCrossAggregatedMetrics,
  fetchLlmMentionsSearch,
  fetchLlmResponse,
  fetchLlmTopPages,
  fetchLocalSerp,
  fetchQuestionsAnswers,
  fetchRankCheckSerp,
  fetchRankCheckTaskResult,
  fetchRankedKeywords,
  fetchReferringDomains,
  fetchRelatedKeywords,
  fetchRelevantPages,
  fetchSerpCompetitors,
  postRankCheckTasks
};
