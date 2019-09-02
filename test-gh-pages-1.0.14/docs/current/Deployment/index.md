---
layout: page
title: Deployment
permalink: /:path/
sort_idx: 30
---

{% include variables.md %}
{% assign service_name    = "EPL" %}
{% assign service_name_lo = "epl" %}
{% assign service_version = "1.0.0" %}
{% assign rest_api_port = "30810" %}


* TOC
{:toc}

All Kaa services, including {{service_name}}, are distributed as [Docker](https://www.docker.com/) images.
You can run these images using software containerization and orchestration tools, such as Docker, Docker Swarm, Docker Compose, [Kubernetes](https://kubernetes.io/), etc.
Kubernetes is the recommended system for managing Kaa-based clusters.


# Runtime dependencies

{{service_name}} has the following runtime dependencies:

- [NATS](http://nats.io/) for inter-service communication.

Regardless of the deployment method, always make sure that you have dependency services up and running prior to starting up {{service_name}}.

The below instructions where {{service_name}} sources its configuration data from a local file.


# Environment variables

The table below summarizes the variables supported by the {{service_name}} Docker image and provides default values along with descriptions.

| Variable name                 | Default value                                  | Description                                                                                                                                                                                                                                   |
|-------------------------------|------------------------------------------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
|`INSTANCE_NAME`                |**{{service_name_lo}}**                         |Service instance name.                                                                                                                                                                                                                         |
|`APP_CONFIG_PATH`              |**/srv/{{service_name_lo}}/service-config.yml** |Path to the service configuration YAML file inside container. In case of running in Kubernetes, consider using [K8s Volumes](https://kubernetes.io/docs/concepts/storage/volumes/) for externalization.                                        |
|`JMX_ENABLE`                   |**false**                                       |Enables JMX monitoring.                                                                                                                                                                                                                        |
|`JMX_PORT`                     |**10500**                                       |JMX service port.                                                                                                                                                                                                                              |
|`JMX_MONITOR_USER_PASSWORD`    |                                                |JMX monitor user password. Required when `JMX_ENABLE=true`.                                                                                                                                                                                    |
|`JAVA_OPTIONS`                 |**-Xmx700m**                                    |Additional parameters for Java process launch.                                                                                                                                                                                                 |
|`NATS_USERNAME`                |                                                |Username for connecting to NATS message broker.                                                                                                                                                                                                |
|`NATS_PASSWORD`                |                                                |Password for connecting to NATS message broker.                                                                                                                                                                                                |
|`KAA_LICENSE_CERT_PATH`        |**/run/license/license.p12**                    |Path to the Kaa platform license certificate file in PKCS #12 format.                                                                                                                                                                          |
|`KAA_LICENSE_CERT_PASSWORD`    |                                                |License certificate password. Required.                                                                                                                                                                                                        |


# Kubernetes

To run {{service_name}} on Kubernetes:
1. [Install Kubernetes](https://kubernetes.io/docs/home/).
2. Set up [NATS as a Kubernetes service](http://nats.io/documentation/tutorials/nats-kubernetes/) or a standalone server.
3. Prepare [Kubernetes deployment descriptor](#deployment-descriptor).
4. **(Optional)** Configure [volumes and secrets](#volumes-and-secrets).
5. Prepare a [config map]({{docs_url}}DOC/docs/current/Architecture-overview/#configuration), or a separate [configuration file]({{root_url}}Configuration) and save it into a file available to pods under `APP_CONFIG_PATH`.
6. Start up the pod:
   ```
   kubectl create -f <deployment descriptor filename>
   ```
7. Check that pods are running:
   ```
   kubectl get pods
   ```


## Deployment descriptor

Provided below is a sample [deployment descriptor](https://kubernetes.io/docs/concepts/workloads/controllers/deployment/) file that pulls the {{service_name}} version {{service_version}} Docker image from the official KaaIoT repository and runs one service replica (pod) with 1 GB RAM limit.
With this deployment descriptor, the configuration file is expected to be located at `~/{{service_name_lo}}-config/service-config.yml` of the host machine.
See `spec.template.spec.volumes.hostPath` below and the default [`APP_CONFIG_PATH`](#environment-variables) above.

```yaml
apiVersion: extensions/v1beta1
kind: Deployment
metadata:
  name: {{service_name_lo}}
spec:
  replicas: 1
  template:
    metadata:
      labels:
        app: {{service_name_lo}}
        tier: backend
    spec:
      containers:
      - name: {{service_name_lo}}
        image: hub.kaaiot.net/kaaiot/{{service_name_lo}}/{{service_name_lo}}:{{service_version}}
        terminationMessagePolicy: FallbackToLogsOnError
        imagePullPolicy: Always
        livenessProbe:
          httpGet:
            path: /health
            port: management
          initialDelaySeconds: 30
          periodSeconds: 5
        readinessProbe:
          httpGet:
            path: /health
            port: management
          initialDelaySeconds: 1
          periodSeconds: 1
        resources:
          requests:
            memory: 100Mi
          limits:
            memory: 1Gi
        env:
        - name: KAA_LICENSE_CERT_PASSWORD
          valueFrom:
            secretKeyRef:
              name: license.cert.pass
              key: password
        ports:
        - name: management
          containerPort: 8080
        - name: jmx
          containerPort: 10500
        volumeMounts:
        - name: license-volume
          mountPath: /run/license
        - name: {{service_name_lo}}-conf-volume
          mountPath: /srv/{{service_name_lo}}
      imagePullSecrets:
      - name: kaaid
      volumes:
        - name: {{service_name_lo}}-conf-volume
          hostPath: ~/{{service_name_lo}}-config
          defaultMode: 444
        - name: license-volume
          secret:
            secretName: license.cert
```

Below are some notable parameters of the deployment descriptor:
- `spec.replicas` defines the number of service instance replicas.
- `spec.template.spec.containers.image` defines the Docker image to be used, while `spec.template.spec.containers.imagePullPolicy` defines the image update policy.
- `spec.template.spec.imagePullSecrets` specifies the [image pull secret](https://kubernetes.io/docs/concepts/containers/images/#specifying-imagepullsecrets-on-a-pod) for the official KaaIoT docker registry.
  To define this secret, use your KaaID credentials:
  ```
  $ export HISTCONTROL=ignorespace  # Prevent saving your credentials in the shell history
  $  KAAID_USER=<your KaaID username>; kubectl create secret docker-registry kaaid --docker-server=hub.kaaiot.net --docker-username=$KAAID_USER --docker-email=$KAAID_USER --docker-password=<your KaaID password>
  ```
- `spec.template.spec.volumes.name.license-volume` specifies the volume to contain the license certificate file. We recommend that this volume is created from a [Kubernetes secret](https://kubernetes.io/docs/concepts/configuration/secret/#using-secrets-as-files-from-a-pod).
- `spec.template.spec.containers.name.{{service_name_lo}}.env.name.KAA_LICENSE_CERT_PASSWORD` defines the license certificate password environment variable, which is also recommended to be set from a Kubernetes secret.
- `spec.template.metadata.labels.app` defines the application label to map Kubernetes deployment to the service.
- `spec.template.spec.containers.resources` defines resources available to each replica. See how Kubernetes [manages compute resources for containers](https://kubernetes.io/docs/concepts/configuration/manage-compute-resources-container/).
- `spec.template.spec.containers.env` defines [the environment variables](#environment-variables) that Kubernetes passes to the service replica.
- `spec.template.spec.containers.ports` defines the exposed ports.
  See [Connecting applications with services](https://kubernetes.io/docs/concepts/services-networking/connect-applications-service/).


## Volumes and secrets

The above deployment descriptor mounts a host machine directory for the service to load its configuration file from.
However, such simple configuration may not be convenient in multi-node deployments and you might want to create other types of volumes.
Besides, if you want to pass sensible pieces of information to the service using the [environment variables](#environment-variables), such as logins and passwords for dependency services, we recommend using Kubernetes Secrets.
To learn more about these subjects, refer to Kubernetes documentation:
- [Volumes](https://kubernetes.io/docs/concepts/storage/volumes/)
- [Secrets](https://kubernetes.io/docs/concepts/configuration/secret/)
- [Config maps](https://kubernetes.io/docs/tasks/configure-pod-container/configure-pod-configmap/)


# Docker

To run {{service_name}} in Docker:
1. [Install Docker](https://docs.docker.com/engine/installation/).
2. Set up [NATS as a Docker container](http://nats.io/documentation/tutorials/gnatsd-docker/) or a standalone server.
3. Prepare a [configuration file]({{root_url}}Configuration) and save it into a file available to the container under `APP_CONFIG_PATH`.
4. Run Docker container.
   For example, use the following command to run the {{service_name}} version {{service_version}} image:
   ```
   $ docker run \
       -p 80:80 \
       -v <host_path_to_config_directory>:/srv/{{service_name_lo}} \
       hub.kaaiot.net/kaaiot/{{service_name_lo}}/{{service_name_lo}}:{{service_version}}
   ```
