---
layout: page
title: Overview
permalink: /:path/
sort_idx: 10
---

{% include variables.md %}
{% assign service_name    = "EPL" %}
{% assign service_name_lo = "epl" %}

* TOC
{:toc}

Endpoint Lifecycle service ({{service_name}}) is a Kaa platform component that monitors endpoint connectivity status and can update a configurable endpoint metadata field with a current connectivity status.


# Interfaces

{{service_name}} supports a number of interfaces to perform its functional role.
The key supported interfaces are summarized in the following diagram.

![{{service_name}} interfaces diagram](attach/{{service_name_lo}}.svg)

For inter-service communication, Kaa services mainly use REST APIs and messaging protocols that run over [NATS](https://nats.io/) messaging system.


## Endpoint connectivity events

To know when endpoint goes online or offline, {{service_name}} listens to endpoint connectivity events defined in [9/ELCE][9/ELCE].


## EP metadata management

{{service_name}} can be optionally configured to update current EP connectivity state as EP metadata field in [Endpoint Register (EPR)]({{docs_url}}EPR/) or other compatible EP register service using the REST API of that service.


[9/ELCE]: {{rfc_url}}0009/README.md


## Time series transmission

{{service_name}} can be configured to produce time series data points on endpoint connect and disconnect. 
To do so, {{service_name}} supports [14/TSTP](https://github.com/kaaproject/kaa-rfcs/blob/master/0014/README.md) and acts as a time series transmitter to subscribers.
The time series will contain a JSON record with the "value" field set to 1 for online status, 0 - for offline.
See [the configuration page]({{root_url}}Configuration/#kaa-applications) for information on how to configure this interface. 
If you don't need this functionality, just do not configure this section.
