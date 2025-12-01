# Digital Ocean Deployment Guide

This guide explains how to deploy the Base2 application to a Digital Ocean Droplet using the provided automation scripts.

## Prerequisites

1.  **Digital Ocean Account**: You need an active account.
2.  **GitHub Personal Access Token (PAT)**: Required if your repository is private.
    - Go to GitHub > Settings > Developer settings > Personal access tokens > Tokens (classic).
    - Generate a new token with `repo` scope.
    - **Copy the token immediately.**

## Deployment Steps

### 1. Prepare the Cloud-Init Script

1.  Open `scripts/deploy/cloud-init.yml`.
2.  Locate the `runcmd` section.
3.  Update the `REPO_URL` line.
    - **Public Repo**: `export REPO_URL="https://github.com/YOUR_USERNAME/YOUR_REPO.git"`
    - **Private Repo**: `export REPO_URL="https://YOUR_GITHUB_TOKEN@github.com/YOUR_USERNAME/YOUR_REPO.git"`
    - _Replace `YOUR_GITHUB_TOKEN`, `YOUR_USERNAME`, and `YOUR_REPO` with your actual details._

### 2. Create the Droplet

1.  Log in to Digital Ocean and click **Create > Droplets**.
2.  **Region**: Choose your preferred region.
3.  **Datacenter**: Choose a datacenter.
4.  **Image**: Choose **Ubuntu 22.04 (LTS) x64**.
5.  **Size**: Choose a size (Basic, Regular Intel with 2GB RAM is recommended minimum for Docker).
6.  **Authentication**: Choose SSH Key (recommended) or Password.
7.  **User Data**:
    - Click **Select additional options** (or "Advanced Options").
    - Check **User Data**.
    - **Paste the content of your modified `cloud-init.yml` into the text box.**
8.  **Finalize**: Click **Create Droplet**.

### 3. Verify Deployment

1.  Wait for the Droplet to be created and for the initialization to complete (this can take 5-10 minutes).
2.  SSH into your droplet:
    ```bash
    ssh root@YOUR_DROPLET_IP
    ```
3.  Check the cloud-init status:

    ```bash
    tail -f /var/log/cloud-init-output.log
    ```

    You should see "The system is finally up" when finished.

4.  Switch to the `deploy` user and check containers:
    ```bash
    su - deploy
    cd ~/app
    docker-compose -f production.docker.yml ps
    ```

### 4. Post-Deployment Configuration

The automated setup uses default values from `.env.example`. You **MUST** update these for production security.

1.  SSH into the server as `deploy` (or root and switch user).
2.  Edit the `.env` file:
    ```bash
    nano ~/app/.env
    ```
3.  Update critical values:
    - `POSTGRES_PASSWORD`
    - `JWT_SECRET`
    - `STRIPE_SECRET_KEY`
    - `EMAIL_` settings
4.  Restart the application to apply changes:
    ```bash
    docker-compose -f production.docker.yml down
    docker-compose -f production.docker.yml up -d
    ```

## Troubleshooting

- **Repo Clone Failed**: Check `/var/log/cloud-init-output.log`. If git clone failed, your PAT might be invalid or the URL format incorrect.
- **Containers Not Starting**: Run `docker-compose -f production.docker.yml logs` to see application logs.
