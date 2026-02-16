# Treasury transfer proposal workflow

This repo includes a GitHub Actions workflow to create a `TransferSnsTreasuryFunds` SNS proposal.

## Recommended authoring flow

1. Create a release tag for the change set you want to run from (PROD is tag-gated).
2. Write the proposal summary in a Markdown file (multi-line, proper formatting), e.g.
   - `docs/treasury/summary.md` (copy from `docs/treasury/summary-template.md`).
3. Run the GitHub Actions workflow:
   - `.github/workflows/transfer_sns_treasury_funds_PROD.yml`
   - Fill inputs normally, and set `summaryPath` to your Markdown file path.

## Notes

- If you do not set `summaryPath`, you can still use the `summary` input by writing `\n` for newlines.
- The workflow submits the proposal using `PROD_NEURON_ID` and `PROD_IDENT` secrets.
