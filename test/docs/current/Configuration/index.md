---
layout: page
title: Configuration
permalink: /:path/
sort_idx: 40
---

{% include variables.md %}
{% assign service_name    = "EPL" %}
{% assign service_name_lo = "epl" %}

* TOC
{:toc}


The {{service_name}} loads configuration data from a file (typically backed by a [Kubernetes config map](https://kubernetes.io/docs/tasks/configure-pod-container/configure-pod-configmap/)).
If the service is unable to retrieve the configuration data, it will not start.
Refer to the [configuration]({{docs_url}}DOC/docs/current/Architecture-overview/#configuration) for details.


# Service configuration structure

The recommended configuration format is YAML.
The below sections describe the officially supported configuration options that influence various aspects of the service functionality.
The service may support options other than the ones listed below, but those are not a part of the public API and may be changed or deleted at any time.


<!-- SECTION: service-specific configuration -->

## General service configuration

{{service_name}} uses a standard Spring Boot `server.port` property to configure the port to expose the REST API at.

```yaml
server:
  port: <unsigned short integer>  # Server port used to expose the REST API at
```


<!-- SECTION: application-specific configuration -->

## Kaa applications

Many Kaa services can be configured for different behavior depending on the application version of the endpoint the processed data relates to.
This is called *appversion-specific behavior* and is handled in service configurations under `kaa.applications`.

{{service_name}} can update metadata keys in the endpoint register on receiving EP connectivity events.
The metadata keys to update are controlled with appversion-specific configuration below.
If the key is not defined for an appversion, {{service_name}} does not update it in the register.

```yaml
kaa:
  applications:
    <application 1 name>:
      versions:
        <application 1 version 1 name>:
          connectivity:
            metadata-keys:
              state: <string>    # EP metadata key to update with the current EP connectivity state (true for connected / false for disconnected state)
              state-ts: <string> # EP metadata key to update with the last EP connectivity transition timestamp
            time-series:
              name: <string>     # Connectivity state time series name that EPL will produce.
```

For example:
```yaml
kaa:
  applications:
    smart_kettle:
      versions:
        kettle_v1:                     # Connectivity state keys are not managed for "kettle_v1" application version
        kettle_v2:                     # "kettle_v2" defines EP metadata keys for connectivity state and last transition timestamps
          connectivity:
            metadata-keys:
              state: connected           # "connected" tag will be set to true when EP is connected and false otherwise
              state-ts: connectivity_ts  # "connectivity_ts" tag will contain the last transition timestamp
            time-series:
              name: ep-online            # 'ep-online' time series will be published on EP connect/disconnect
        kettle_v3:                     # "kettle_v3" explicitly specifies no connectivity metadata fields
          connectivity:
            metadata-keys: null
```

<!-- SECTION: external kaa services configuration -->

## Endpoint register interface

Use the below parameters to configure the REST-based endpoint register interface {{service_name}} uses to validate that EP ID exists and to listen to EP unregistered events.

```yaml
kaa:
  epl:
    ep-register:
      base-url: <URL>                  # Base URL of the endpoint register REST API
```


## Communication service interface

```yaml
kaa:
  epl:
    communication-service:
      service-instance:
        name: <service instance name>  # Instance name of the communication service
```


<!-- SECTION: common external services (NATS, etc.) -->

## NATS

The below parameters configure {{service_name}}'s connection to NATS.
Note that for security reasons NATS username and password are sourced from the [environment variables]({{root_url}}Deployment/#environment-variables).

```yaml
nats:
  urls: <comma separated list of URL>   # NATS connection URLs
```


<!-- SECTION: management -->

## Management

<!-- Current Spring Boot Actuator version is 1.5.6: see the link below. -->
{{service_name}} monitoring and management implementation is based on the [Spring Boot Actuator](https://docs.spring.io/spring-boot/docs/1.5.6.RELEASE/reference/html/production-ready.html).
Refer to the corresponding documentation for the list of supported configuration options.

<!-- SECTION: management -->

## Management

<!-- SECTION: Authentication -->

## Authentication

{{service_name}} use [auth-kaa-starter](https://gitlab.kaaiot.net/core/lib/auth-kaa-starter) for make authenticated REST API calls. 
Authentication implemented according to oAuth protocol.

```yaml
security:
  oauth2:
    client:
      enabled: <boolean>             # Is authentication enable for {{service_name}} REST calls. False by default
      base-url: <URL>                # Base host url to oAuth provider (e.g. Keycloak)
      realm: <realm name>            # Realm in oAuth provider
      clientId: <client ID>          # Client ID on whose behalf the requests will be made
      clientSecret: <client secret>  # Client secret on whose behalf the requests will be made
```


<!-- SECTION: logging -->

## Logging

By default, {{service_name}} uses [Spring Boot logging configuration](https://docs.spring.io/spring-boot/docs/1.5.6.RELEASE/reference/html/howto-logging.html) with [logback](https://logback.qos.ch/) for logging.
Refer to the corresponding documentation for the list of supported configuration options.


# Built-in configuration profiles

For your convenience, {{service_name}} comes with a default built-in configuration profile.

Built-in profile is optimized for a Kubernetes-based production deployment.
It does not define any Kaa applications—you have to configure those for any specific Kaa-based solution.


## Default

```yaml
server:
  port: 80

kaa:
  epl:
    communication-service:
      service-instance:
        name: kpc
    ep-register:
      base-url: http://epr

nats:
  urls: nats://nats:4222

management:
  port: 8080
  security:
    enabled: false

endpoints:
  enabled: false
  health:
    enabled: true
    mapping.UNKNOWN: SERVICE_UNAVAILABLE
  info.enabled: true
  metrics.enabled: true

```
