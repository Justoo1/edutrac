interface AnalyticsEvent {
  name: string;
  properties?: Record<string, any>;
}

const va = {
  track: (event: AnalyticsEvent["name"], properties?: AnalyticsEvent["properties"]) => {
    // In a real implementation, this would send data to an analytics service
    console.log("Analytics event:", event, properties);
  },
};

export default va; 