import React, { useEffect, useState } from 'react';
import Sidebar from '../../components/sidebar/sidebar';
import { useNavigate } from 'react-router-dom';
import { useAuthStore, usePostStore } from '../../store';
import './cycles.scss';
import { IoIosRefresh } from 'react-icons/io';
import { IoIosArrowDown } from 'react-icons/io';

import { CanisterCyclesValue } from '../../shared/types';

export const Cycles: React.FC = () => {
  const navigate = useNavigate();
  const { isLoggedIn } = useAuthStore((state) => ({
    isLoggedIn: state.isLoggedIn,
  }));

  const { getDappCanisters, getSnsCanisters } = usePostStore((state) => ({
    getDappCanisters: state.getDappCanisters,
    getSnsCanisters: state.getSnsCanisters,
  }));

  const [isLoadingSnsCanisters, setIsLoadingSnsCanisters] = useState(false);
  const [isLoadingDappCanisters, setIsLoadingDappCanisters] = useState(false);
  const [status, setStatus] = useState('-');

  const [snsCanisters, setSnsCanisters] = useState<CanisterCyclesValue[]>([]);
  const [dappCanisters, setDappCanisters] = useState<CanisterCyclesValue[]>([]);
  const [isDappCanistersOpen, setIsDappCanistersOpen] = useState(false);

  const loadSnsCanisters = async () => {
    setIsLoadingSnsCanisters(true);
    let summary = await getSnsCanisters();
    if (summary) {
      setSnsCanisters([
        {
          cai: `${summary.root[0]?.canister_id[0]?.toText()} (Root)`,
          cycles: Number(summary.root[0]?.status[0]?.cycles),
        },
        {
          cai: `${summary.swap[0]?.canister_id[0]?.toText()} (Swap)`,
          cycles: Number(summary.swap[0]?.status[0]?.cycles),
        },
        {
          cai: `${summary.ledger[0]?.canister_id[0]?.toText()} (Ledger)`,
          cycles: Number(summary.ledger[0]?.status[0]?.cycles),
        },
        {
          cai: `${summary.index[0]?.canister_id[0]?.toText()} (Index)`,
          cycles: Number(summary.index[0]?.status[0]?.cycles),
        },
        {
          cai: `${summary.governance[0]?.canister_id[0]?.toText()} (Governance)`,
          cycles: Number(summary.governance[0]?.status[0]?.cycles),
        },
        ...summary.archives.map((archive, index) => {
          return {
            cai: `${archive?.canister_id[0]?.toText()} (Archive ${index})`,
            cycles: Number(archive?.status[0]?.cycles),
          };
        }),
      ]);
    }
    setIsLoadingSnsCanisters(false);
  };

  const loadDappCanisters = async () => {
    setIsLoadingDappCanisters(true);
    let [registeredCanisters, status] = await getDappCanisters();
    setDappCanisters(
      registeredCanisters.map((registeredCanister) => {
        return {
          cai: registeredCanister.canisterId,
          cycles: Number(registeredCanister.balance),
        };
      })
    );
    setStatus(status);
    setIsLoadingDappCanisters(false);
  };

  useEffect(() => {
    if (!isLoggedIn) {
      navigate('/');
    }
    loadSnsCanisters();
    loadDappCanisters();
  }, [isLoggedIn]);

  return (
    <div className='page-wrapper'>
      <Sidebar />
      <div className='cycles-wrapper'>
        <div className='cycles-box'>
          <div className='cycles-title-refresh-wrapper'>
            <div className='cycles-title-status-wrapper'>
              <div className='cycles-title'>dApp canisters</div>
              <div className='cycles-status'>
                {isLoadingDappCanisters ? '-' : status}
              </div>
            </div>
            <div className='buttons'>
              <IoIosArrowDown
                className='arrow-button'
                style={
                  isDappCanistersOpen
                    ? {
                        transform: 'rotate(180deg)',
                      }
                    : {}
                }
                onClick={() => {
                  setIsDappCanistersOpen(!isDappCanistersOpen);
                }}
              />
              <IoIosRefresh
                onClick={async () => {
                  await loadDappCanisters();
                }}
                className={
                  isLoadingDappCanisters
                    ? 'refresh-button spinning'
                    : 'refresh-button'
                }
              />
            </div>
          </div>
          {isDappCanistersOpen && (
            <div className='cycles-values-wrapper'>
              {dappCanisters.map((balance) => {
                return (
                  <div className='cycles-value-wrapper'>
                    <div className='name'>{balance.cai}</div>
                    <div
                      className={
                        balance.cycles < 10000000000000 ? 'value red' : 'value'
                      }
                    >
                      {isLoadingDappCanisters
                        ? '-'
                        : (balance.cycles / 1000000000000).toFixed(2) + 'T'}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        <div className='cycles-box'>
          <div className='cycles-title-refresh-wrapper'>
            <div className='cycles-title'>SNS Canisters</div>
            <IoIosRefresh
              onClick={async () => {
                await loadSnsCanisters();
              }}
              className={
                isLoadingSnsCanisters
                  ? 'refresh-button spinning'
                  : 'refresh-button'
              }
            />
          </div>
          <div className='cycles-values-wrapper'>
            {snsCanisters.map((balance) => {
              return (
                <div className='cycles-value-wrapper'>
                  <div className='name'>{balance.cai}</div>
                  <div
                    className={
                      balance.cycles < 50000000000000 ? 'value red' : 'value'
                    }
                  >
                    {isLoadingSnsCanisters
                      ? '-'
                      : (balance.cycles / 1000000000000).toFixed(2) + 'T'}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cycles;
