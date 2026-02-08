---
title: 'When DNS Broke Half the Internet'
description: 'How a single DNS failure in AWS US-EAST-1 took down Netflix, Snapchat, and hundreds of services and what we can learn from it.'
pubDate: 2025-10-21
---

Yesterday major platforms like Netflix, Snapchat, Pinterest went down. Communication applications like WhatsApp, Signal and Slack were affected. Gaming platforms like Fortnite and Roblox became unplayable. What do all these applications have in common?

A single cloud vendor: **AWS**

Wait, I thought AWS has multiple availability zones (AZ's) in the Virginia Region designed to prevent this kind of outage.

Here's the distinction: The failure wasn't a physical failure within an availability zone. It was in a shared regional control plane service. Availability zones provide physical redundancy - if one fails, others are operational. But they all depend on the same control plane for critical operations. **When the control plane fails, the entire region fails.**

## What actually happened?

The problem started at 3:11 AM ET on October 20, 2025 in `US-EAST-1` (Virginia) - AWS's largest & most heavily-loaded cloud region. A DNS resolution issue for a `DynamoDB` (Amazon's NoSQL database) API endpoint cascaded across the entire region.

The domino effect:
- A technical update corrupted DNS records for DynamoDB endpoints.
- Applications couldn't resolve the DynamoDB API address (`dynamodb.us-east-1.amazonaws.com`). DNS acts as the Internet's phonebook.
- DynamoDB isn't just used by the customers - it's the core internal service used by *AWS control plane* itself to manage metadata for other essential services like EC2 (virtual servers), IAM (identity) and Lambda Functions.
- When DNS failed, apps couldn't connect to the database, causing services like Lambda Functions to fail.
- Network Load Balancer failed, causing traffic routing issues across multiple services.
- Client retries flooded the system, creating a feedback loop which made recovery harder for the developers.
- The outage lasted approximately 7 hours, with estimated losses in hundreds of millions.


**Why US-EAST-1 matters**: This is the default AWS region, hosts critical global control plane services, and powers a disproportionate amount of the internet. When it goes down, the blast radius is global. You can track the live status of AWS services on their [Service Health Dashboard](https://health.aws.amazon.com/health/status).


## How to avoid this?

I studied these concepts during my Fault Tolerance lectures in college and while pursuing my AWS cloud architect certification (SAA). Here's what actually works:

**Multi-Region Environments**: Run your workloads across multiple AWS regions. If Virginia goes down, your users hit the Ohio region instead. You'll have to think about data replication and whether both regions serve traffic simultaneously (active-active) or one stays on standby (active-passive).

**Multi-Cloud Strategy**: Spread critical systems across AWS, Azure and GCP. True isolation from vendor lock-in but more complex and expensive to manage.


### Define Recovery Goals

If this outage happens, we have to define recovery goals, 2 metrics define how your system should recover from failures:

- **RTO (Recovery Time Objective)**: How fast must your service recover after a failure? For example: Critical systems like payments and authentication may need to recover within minutes, while analytics dashboards can wait an hour.

- **RPO (Recovery Point Objective)**: How much data you can afford to lose. The lower the RPO, the more continuous replication you need. Financial transactions need near-zero data loss, but logs can afford to lose a day's worth if disaster strikes.

AWS has a detailed guide on [establishing RPO and RTO targets for cloud applications](https://aws.amazon.com/blogs/mt/establishing-rpo-and-rto-targets-for-cloud-applications/).

### Test your failures

You can actually test your failures before they happen.

Back in 2011, Netflix created a tool called [**Chaos Monkey**](https://github.com/Netflix/chaosmonkey) that randomly terminates servers in production to test if their systems can handle failures. Sounds crazy? That's the point.

*"If you aren't breaking things on purpose, you're letting them break by accident."*

This approach, called [**Chaos Engineering**](https://en.wikipedia.org/wiki/Chaos_engineering), helps companies build resilient systems. They deliberately kill their own servers during business hours to ensure engineers design for failures. Think of it as a fire drill for your infrastructure.

Start small. Simulate a DNS failure or database slowdown in your test environment. The key is knowing your system survives before disaster strikes. If you want to dive deeper, check out the [Principles of Chaos Engineering](https://principlesofchaos.org/).


Lastly, this outage reminded us that no cloud provider is bulletproof. Eventually, all systems have a single point of failure somewhere. The next one is inevitable. Start building resilience now.
